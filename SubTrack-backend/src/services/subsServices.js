// Backend: Enhanced subscription services with auto-update functionality
// File: SubTrack-backend/src/services/subsServices.js

import { query } from "../db.js";

/**
 * Calculate the next billing date based on current date and billing cycle
 * @param {string} currentDate - Current billing date (ISO string)
 * @param {string} billingCycle - Billing cycle ('daily', 'weekly', 'monthly', 'yearly')
 * @param {number} cycles - Number of cycles to advance (default: 1)
 * @returns {string} Next billing date (ISO string)
 */
const calculateNextBillingDate = (currentDate, billingCycle, cycles = 1) => {
  const date = new Date(currentDate);
  
  switch (billingCycle) {
    case 'daily':
      date.setDate(date.getDate() + cycles);
      break;
    case 'weekly':
      date.setDate(date.getDate() + (7 * cycles));
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + cycles);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + cycles);
      break;
    default:
      // Default to monthly if unknown cycle
      date.setMonth(date.getMonth() + cycles);
  }
  
  return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
};

/**
 * Check if a billing date has passed and needs updating
 * @param {string} billingDate - The billing date to check (ISO string)
 * @returns {boolean} True if the date has passed
 */
const isBillingDatePassed = (billingDate) => {
  const today = new Date();
  const billing = new Date(billingDate);
  
  // Reset time to compare only dates
  today.setHours(0, 0, 0, 0);
  billing.setHours(0, 0, 0, 0);
  
  return billing < today;
};

/**
 * Update a single subscription's next billing date if it has passed
 * @param {Object} subscription - The subscription object
 * @returns {Object} Updated subscription object with needsUpdate flag
 */
const updateSubscriptionDateIfNeeded = (subscription) => {
  if (!subscription.is_active) {
    return { ...subscription, needsUpdate: false };
  }
  
  let updatedSubscription = { ...subscription };
  let currentBillingDate = subscription.next_billing_date;
  let needsUpdate = false;
  
  // Keep advancing the date until it's in the future
  while (isBillingDatePassed(currentBillingDate)) {
    currentBillingDate = calculateNextBillingDate(currentBillingDate, subscription.billing_cycle);
    needsUpdate = true;
  }
  
  if (needsUpdate) {
    updatedSubscription.next_billing_date = currentBillingDate;
    updatedSubscription.needsUpdate = true;
  }
  
  return updatedSubscription;
};

/**
 * Get all subscriptions for a given user with automatic date updates
 */
export const getSubs = async (userId) => {
  const { rows } = await query('SELECT * FROM subscriptions WHERE user_id = $1', [userId]);
  
  // Process each subscription and check if dates need updating
  const processedSubscriptions = [];
  const subscriptionsToUpdate = [];
  
  for (const subscription of rows) {
    const processed = updateSubscriptionDateIfNeeded(subscription);
    processedSubscriptions.push(processed);
    
    if (processed.needsUpdate) {
      subscriptionsToUpdate.push(processed);
    }
  }
  
  // Batch update subscriptions that need date updates
  if (subscriptionsToUpdate.length > 0) {
    await batchUpdateSubscriptionDates(subscriptionsToUpdate);
  }
  
  return processedSubscriptions.map(sub => {
    const { needsUpdate, ...cleanSub } = sub;
    return cleanSub;
  });
};

/**
 * Batch update subscription dates in the database
 * @param {Array} subscriptions - Array of subscriptions to update
 */
const batchUpdateSubscriptionDates = async (subscriptions) => {
  try {
    // Use a transaction for batch updates
    await query('BEGIN');
    
    for (const subscription of subscriptions) {
      await query(
        'UPDATE subscriptions SET next_billing_date = $1 WHERE id = $2',
        [subscription.next_billing_date, subscription.id]
      );
    }
    
    await query('COMMIT');
    console.log(`Auto-updated ${subscriptions.length} subscription dates`);
  } catch (error) {
    await query('ROLLBACK');
    console.error('Error batch updating subscription dates:', error);
    throw error;
  }
};

/**
 * Get all overdue subscriptions across all users (for background job)
 */
export const getOverdueSubscriptions = async () => {
  const today = new Date().toISOString().split('T')[0];
  const { rows } = await query(
    'SELECT * FROM subscriptions WHERE is_active = true AND next_billing_date < $1',
    [today]
  );
  return rows;
};

/**
 * Update overdue subscriptions (can be called by a cron job)
 */
export const updateOverdueSubscriptions = async () => {
  try {
    const overdueSubscriptions = await getOverdueSubscriptions();
    
    if (overdueSubscriptions.length === 0) {
      console.log('No overdue subscriptions found');
      return { updated: 0 };
    }
    
    const subscriptionsToUpdate = overdueSubscriptions.map(updateSubscriptionDateIfNeeded)
      .filter(sub => sub.needsUpdate);
    
    if (subscriptionsToUpdate.length > 0) {
      await batchUpdateSubscriptionDates(subscriptionsToUpdate);
    }
    
    return { updated: subscriptionsToUpdate.length };
  } catch (error) {
    console.error('Error updating overdue subscriptions:', error);
    throw error;
  }
};

/**
 * Get a single subscription by its ID with date update
 */
export const getSubById = async (subId) => {
  const { rows } = await query('SELECT * FROM subscriptions WHERE id = $1', [subId]);
  
  if (rows.length === 0) {
    return null;
  }
  
  const subscription = rows[0];
  const processed = updateSubscriptionDateIfNeeded(subscription);
  
  // Update in database if needed
  if (processed.needsUpdate) {
    await query(
      'UPDATE subscriptions SET next_billing_date = $1 WHERE id = $2',
      [processed.next_billing_date, subscription.id]
    );
  }
  
  const { needsUpdate, ...cleanSub } = processed;
  return cleanSub;
};

/**
 * Create a new subscription
 */
export const createSubs = async (subsData) => {
  const {
    user_id, company, category, billing_cycle,
    next_billing_date, amount, currency, notes, is_active
  } = subsData;

  const { rows } = await query(
    `INSERT INTO subscriptions 
     (user_id, company, category, billing_cycle, next_billing_date, amount, currency, notes, is_active) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
     RETURNING *`,
    [user_id, company, category, billing_cycle, next_billing_date, amount, currency, notes, is_active]
  );
  return rows[0];
};

/**
 * Update an existing subscription by ID
 */
export const updateSubs = async (subsData, subsId) => {
  const {
    company, category, billing_cycle,
    next_billing_date, amount, currency, notes, is_active
  } = subsData;

  const { rows } = await query(
    `UPDATE subscriptions 
     SET company = $1, category = $2, billing_cycle = $3, next_billing_date = $4, 
         amount = $5, currency = $6, notes = $7, is_active = $8 
     WHERE id = $9 
     RETURNING *`,
    [company, category, billing_cycle, next_billing_date, amount, currency, notes, is_active, subsId]
  );
  return rows[0];
};

/**
 * Delete a subscription by ID
 */
export const deleteSubs = async (subsId) => {
  const { rowCount } = await query('DELETE FROM subscriptions WHERE id = $1', [subsId]);
  return rowCount > 0;
};

/**
 * Search subscriptions for a given user using a keyword with auto-update
 */
export const searchSubs = async (searchTerm, userId) => {
  const { rows } = await query(
    `SELECT * FROM subscriptions 
     WHERE user_id = $1 
     AND (company ILIKE $2 OR category ILIKE $2 OR notes ILIKE $2 OR CAST(amount AS TEXT) ILIKE $2)`,
    [userId, `%${searchTerm}%`]
  );
  
  // Process search results for date updates
  const processedSubscriptions = [];
  const subscriptionsToUpdate = [];
  
  for (const subscription of rows) {
    const processed = updateSubscriptionDateIfNeeded(subscription);
    processedSubscriptions.push(processed);
    
    if (processed.needsUpdate) {
      subscriptionsToUpdate.push(processed);
    }
  }
  
  // Batch update if needed
  if (subscriptionsToUpdate.length > 0) {
    await batchUpdateSubscriptionDates(subscriptionsToUpdate);
  }
  
  return processedSubscriptions.map(sub => {
    const { needsUpdate, ...cleanSub } = sub;
    return cleanSub;
  });
};

/**
 * Get subscriptions that are due within the next X days (default 30) with auto-update
 */
export const getUpcomingSubscriptions = async (userId, days = 30) => {
  // First get all active subscriptions and update dates if needed
  const allSubs = await getSubs(userId);
  
  // Then filter for upcoming ones
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  const futureDateStr = futureDate.toISOString().split('T')[0];

  return allSubs.filter(sub => 
    sub.is_active && 
    sub.next_billing_date <= futureDateStr
  ).sort((a, b) => new Date(a.next_billing_date) - new Date(b.next_billing_date));
};

/**
 * Get basic statistics for a user's subscriptions with auto-update
 */
export const getSubscriptionStats = async (userId) => {
  // Use getSubs to ensure dates are updated
  const subscriptions = await getSubs(userId);
  
  const stats = {
    total_count: subscriptions.length,
    active_count: subscriptions.filter(sub => sub.is_active).length,
    total_active_amount: subscriptions
      .filter(sub => sub.is_active)
      .reduce((sum, sub) => sum + parseFloat(sub.amount || 0), 0),
    category_count: new Set(subscriptions.map(sub => sub.category).filter(Boolean)).size
  };

  return stats;
};

/**
 * Get active subscriptions grouped by category with auto-update
 */
export const getSubscriptionsByCategory = async (userId) => {
  // Use getSubs to ensure dates are updated
  const subscriptions = await getSubs(userId);
  
  const categoryGroups = {};
  
  subscriptions
    .filter(sub => sub.is_active)
    .forEach(sub => {
      const category = sub.category || 'Uncategorized';
      if (!categoryGroups[category]) {
        categoryGroups[category] = {
          category,
          subscription_count: 0,
          total_amount: 0
        };
      }
      categoryGroups[category].subscription_count++;
      categoryGroups[category].total_amount += parseFloat(sub.amount || 0);
    });

  return Object.values(categoryGroups)
    .sort((a, b) => b.total_amount - a.total_amount);
};