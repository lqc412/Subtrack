// Enhanced subscription controller with auto-update functionality
// File: SubTrack-backend/src/controllers/subsController.js

import * as subsService from '../services/subsServices.js';
import { query } from '../db.js';
import langGraphAgentService from '../services/aiAgentService.js';
import { normalizeChatActions } from '../utils/chatActions.js';

/**
 * Get all subscriptions for the authenticated user with auto-update
 */
export const getSubs = async (req, res) => {
  try {
    const userId = req.user.id;
    const subs = await subsService.getSubs(userId);
    
    // Add metadata about any auto-updates that occurred
    const response = {
      subscriptions: subs,
      metadata: {
        totalCount: subs.length,
        activeCount: subs.filter(sub => sub.is_active).length,
        lastUpdated: new Date().toISOString()
      }
    };
    
    res.status(200).json(subs); // Keep backward compatibility, send just the array
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * Create a new subscription for the authenticated user
 */
export const createSubs = async (req, res) => {
  try {
    const userId = req.user.id;
    const subsData = { ...req.body, user_id: userId };
    const newSubs = await subsService.createSubs(subsData);
    res.status(201).json(newSubs);
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * Update a subscription if it belongs to the authenticated user
 */
export const updateSubs = async (req, res) => {
  try {
    const userId = req.user.id;
    const subsId = parseInt(req.params.id);

    const subscription = await subsService.getSubById(subsId);
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    if (subscription.user_id !== userId) {
      return res.status(403).json({ message: 'You do not have permission to modify this subscription' });
    }

    const subsData = req.body;
    const updatedSubs = await subsService.updateSubs(subsData, subsId);

    if (!updatedSubs) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    res.status(200).json(updatedSubs);
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * Delete a subscription if it belongs to the authenticated user
 */
export const deleteSubs = async (req, res) => {
  try {
    const userId = req.user.id;
    const subsId = req.params.id;

    const subscription = await subsService.getSubById(subsId);
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    if (subscription.user_id !== userId) {
      return res.status(403).json({ message: 'You do not have permission to delete this subscription' });
    }

    const deleted = await subsService.deleteSubs(subsId);
    if (!deleted) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    res.status(200).send();
  } catch (error) {
    console.error('Error deleting subscription:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * Search subscriptions for the authenticated user with auto-update
 */
export const searchSubs = async (req, res) => {
  try {
    const userId = req.user.id;
    const searchTerm = req.query.q;
    const subs = await subsService.searchSubs(searchTerm, userId);
    res.status(200).json(subs);
  } catch (error) {
    console.error('Error searching subscriptions:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * Get upcoming subscriptions (due within specified days) with auto-update
 */
export const getUpcomingSubs = async (req, res) => {
  try {
    const userId = req.user.id;
    const days = parseInt(req.query.days) || 30;
    
    const upcomingSubs = await subsService.getUpcomingSubscriptions(userId, days);
    
    res.status(200).json({
      subscriptions: upcomingSubs,
      metadata: {
        daysRange: days,
        count: upcomingSubs.length,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching upcoming subscriptions:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * Get subscription statistics with auto-update
 */
export const getSubsStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await subsService.getSubscriptionStats(userId);
    
    res.status(200).json({
      ...stats,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching subscription statistics:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * Get subscriptions grouped by category with auto-update
 */
export const getSubsByCategory = async (req, res) => {
  try {
    const userId = req.user.id;
    const categoryData = await subsService.getSubscriptionsByCategory(userId);
    
    res.status(200).json({
      categories: categoryData,
      metadata: {
        totalCategories: categoryData.length,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching subscriptions by category:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * Manually trigger date updates for user's subscriptions
 */
export const updateSubDates = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get all user's subscriptions
    const subscriptions = await query(
      'SELECT * FROM subscriptions WHERE user_id = $1 AND is_active = true',
      [userId]
    );
    
    if (subscriptions.rows.length === 0) {
      return res.status(200).json({
        message: 'No active subscriptions found',
        updated: 0
      });
    }
    
    // Check and update overdue subscriptions
    let updatedCount = 0;
    const today = new Date().toISOString().split('T')[0];
    
    for (const subscription of subscriptions.rows) {
      if (subscription.next_billing_date < today) {
        // Calculate next billing date
        let nextDate = new Date(subscription.next_billing_date);
        const currentDate = new Date();
        
        // Keep advancing until future date
        while (nextDate < currentDate) {
          switch (subscription.billing_cycle) {
            case 'daily':
              nextDate.setDate(nextDate.getDate() + 1);
              break;
            case 'weekly':
              nextDate.setDate(nextDate.getDate() + 7);
              break;
            case 'monthly':
              nextDate.setMonth(nextDate.getMonth() + 1);
              break;
            case 'yearly':
              nextDate.setFullYear(nextDate.getFullYear() + 1);
              break;
            default:
              nextDate.setMonth(nextDate.getMonth() + 1);
          }
        }
        
        // Update in database
        await query(
          'UPDATE subscriptions SET next_billing_date = $1 WHERE id = $2',
          [nextDate.toISOString().split('T')[0], subscription.id]
        );
        
        updatedCount++;
      }
    }
    
    res.status(200).json({
      message: `Successfully updated ${updatedCount} subscription dates`,
      updated: updatedCount,
      total: subscriptions.rows.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error updating subscription dates:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * Get recently detected subscriptions from email
 */
export const getRecentSubscriptions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { importId } = req.query;
    
    if (!importId) {
      return res.status(400).json({ message: 'Import ID is required' });
    }
    
    // Get the import log to verify it belongs to the user
    const importLogQuery = await query(
      'SELECT * FROM email_import_logs WHERE id = $1 AND user_id = $2',
      [importId, userId]
    );
    
    if (importLogQuery.rows.length === 0) {
      return res.status(404).json({ message: 'Import log not found' });
    }
    
    const { rows } = await query(
      `SELECT company, category, billing_cycle, next_billing_date, amount, currency,
              notes, is_active, source, source_id, detected_at
         FROM temporary_detected_subscriptions
        WHERE user_id = $1 AND import_id = $2
        ORDER BY detected_at DESC`,
      [userId, importId]
    );

    const normalized = rows.map(row => ({
      company: row.company,
      category: row.category,
      billing_cycle: row.billing_cycle,
      next_billing_date: row.next_billing_date
        ? new Date(row.next_billing_date).toISOString().split('T')[0]
        : null,
      amount: typeof row.amount === 'number' ? row.amount : parseFloat(row.amount),
      currency: row.currency,
      notes: row.notes,
      is_active: row.is_active,
      source: row.source,
      source_id: row.source_id,
      detected_at: row.detected_at,
      detected_via_ai: row.source === 'email-ai'
    }));

    res.status(200).json(normalized);
  } catch (error) {
    console.error('Error fetching recent subscriptions:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * Add subscriptions in batch (for the import functionality)
 */
export const createBatchSubscriptions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { subscriptions } = req.body;
    
    if (!subscriptions || !Array.isArray(subscriptions) || subscriptions.length === 0) {
      return res.status(400).json({ message: 'Valid subscriptions array is required' });
    }
    
    // Process each subscription
    const results = [];
    for (const subscription of subscriptions) {
      // Add user_id to each subscription if not already present
      if (!subscription.user_id) {
        subscription.user_id = userId;
      }
      
      // Validate that this user can only add subscriptions for themselves
      if (subscription.user_id !== userId) {
        return res.status(403).json({ 
          message: 'You can only add subscriptions for your own account' 
        });
      }
      
      // Insert the subscription
      const result = await query(
        `INSERT INTO subscriptions 
         (user_id, company, category, billing_cycle, next_billing_date, amount, currency, notes, is_active, source, source_id) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
         RETURNING *`,
        [
          subscription.user_id,
          subscription.company,
          subscription.category,
          subscription.billing_cycle,
          subscription.next_billing_date,
          subscription.amount,
          subscription.currency,
          subscription.notes,
          subscription.is_active !== undefined ? subscription.is_active : true,
          subscription.source || 'manual',
          subscription.source_id || null
        ]
      );
      
      results.push(result.rows[0]);
    }
    
    res.status(201).json(results);
  } catch (error) {
    console.error('Error creating batch subscriptions:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * Converse with the LangGraph-powered spending advisor chatbot.
 */
export const chatWithSpendAdvisor = async (req, res) => {
  try {
    const userId = req.user.id;
    const { message, goal, actions, history, locale } = req.body;

    const normalizedActions = normalizeChatActions(actions);

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ message: 'Message is required' });
    }

    if (!langGraphAgentService.hasChatAgent()) {
      return res.status(503).json({ message: 'AI assistant is not configured' });
    }

    const { rows: subscriptions } = await query(
      `SELECT id, company, category, billing_cycle, next_billing_date, amount, currency, notes, is_active
         FROM subscriptions
        WHERE user_id = $1`,
      [userId]
    );

    let monthlyTotal = 0;
    let yearlyTotal = 0;

    const normalizedSubs = subscriptions.map(sub => {
      const parsedAmount = typeof sub.amount === 'number' ? sub.amount : parseFloat(sub.amount);
      const amount = Number.isFinite(parsedAmount) ? parsedAmount : 0;

      if (sub.is_active) {
        switch (sub.billing_cycle) {
          case 'yearly':
            yearlyTotal += amount;
            monthlyTotal += amount / 12;
            break;
          case 'weekly':
            yearlyTotal += amount * 52;
            monthlyTotal += amount * 4.33;
            break;
          case 'daily':
            yearlyTotal += amount * 365;
            monthlyTotal += amount * 30.44;
            break;
          default:
            yearlyTotal += amount * 12;
            monthlyTotal += amount;
            break;
        }
      }

      return {
        id: sub.id,
        company: sub.company,
        category: sub.category,
        billing_cycle: sub.billing_cycle,
        next_billing_date: sub.next_billing_date,
        amount,
        currency: sub.currency,
        notes: sub.notes,
        is_active: sub.is_active
      };
    });

    const monthlyRounded = Number(monthlyTotal.toFixed(2));
    const yearlyRounded = Number(yearlyTotal.toFixed(2));

    const aiResponse = await langGraphAgentService.chatWithSpendCoach({
      userId,
      goal,
      message,
      actions: normalizedActions,
      history,
      locale,
      subscriptions: normalizedSubs,
      monthlyTotal: monthlyRounded,
      yearlyTotal: yearlyRounded
    });

    if (!aiResponse) {
      return res.status(503).json({ message: 'AI assistant did not provide a response' });
    }

    res.status(200).json({
      reply: aiResponse.message,
      suggestions: aiResponse.suggestions,
      actions: aiResponse.actions,
      confidence: aiResponse.confidence,
      metadata: {
        monthlyTotal: monthlyRounded,
        yearlyTotal: yearlyRounded,
        subscriptionCount: normalizedSubs.length
      }
    });
  } catch (error) {
    console.error('Error communicating with spend advisor:', error);
    res.status(500).json({ message: 'Failed to contact spending advisor' });
  }
};