// Enhanced subscription controller with auto-update functionality
// File: SubTrack-backend/src/controllers/subsController.js

import * as subsService from '../services/subsServices.js';
import { query } from '../db.js';

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
    
    const importLog = importLogQuery.rows[0];
    
    // Mock data for testing - in a real implementation, you would have saved these
    // during the email parsing process with a reference to the import ID
    const mockDetectedSubscriptions = [
      {
        company: 'Netflix',
        category: 'Entertainment',
        billing_cycle: 'monthly',
        next_billing_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: 15.99,
        currency: 'USD',
        notes: 'Detected from email',
        is_active: true,
        source: 'email',
        source_id: `email_import_${importId}_1`
      },
      {
        company: 'Spotify',
        category: 'Entertainment',
        billing_cycle: 'monthly',
        next_billing_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: 9.99,
        currency: 'USD',
        notes: 'Detected from email',
        is_active: true,
        source: 'email',
        source_id: `email_import_${importId}_2`
      },
      {
        company: 'Adobe Creative Cloud',
        category: 'Productivity',
        billing_cycle: 'monthly',
        next_billing_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: 52.99,
        currency: 'USD',
        notes: 'Detected from email',
        is_active: true,
        source: 'email',
        source_id: `email_import_${importId}_3`
      }
    ];
    
    res.status(200).json(mockDetectedSubscriptions);
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