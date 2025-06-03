// Frontend: Enhanced subscription utilities with auto-update support
// File: SubTrack-frontend/src/utils/subscriptionUtils.js

/**
 * Utility functions for managing subscription dates and billing cycles
 * Note: These functions work with the backend auto-update system
 */

/**
 * Calculate the next billing date based on current date and billing cycle
 * @param {string} currentDate - Current billing date (ISO string)
 * @param {string} billingCycle - Billing cycle ('daily', 'weekly', 'monthly', 'yearly')
 * @param {number} cycles - Number of cycles to advance (default: 1)
 * @returns {string} Next billing date (ISO string)
 */
export const calculateNextBillingDate = (currentDate, billingCycle, cycles = 1) => {
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
export const isBillingDatePassed = (billingDate) => {
  const today = new Date();
  const billing = new Date(billingDate);
  
  // Reset time to compare only dates
  today.setHours(0, 0, 0, 0);
  billing.setHours(0, 0, 0, 0);
  
  return billing < today;
};

/**
 * Get the number of days until the next billing date
 * @param {string} billingDate - The billing date (ISO string)
 * @returns {number} Days until billing (negative if passed)
 */
export const getDaysUntilBilling = (billingDate) => {
  const today = new Date();
  const billing = new Date(billingDate);
  
  // Reset time to compare only dates
  today.setHours(0, 0, 0, 0);
  billing.setHours(0, 0, 0, 0);
  
  const diffTime = billing - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Preview what the next billing date would be (client-side calculation)
 * Used for UI feedback before API calls
 * @param {Object} subscription - The subscription object
 * @returns {Object} Subscription with predicted next date
 */
export const previewNextBillingDate = (subscription) => {
  if (!subscription.is_active) {
    return subscription;
  }
  
  let currentBillingDate = subscription.next_billing_date;
  
  // Keep advancing the date until it's in the future
  while (isBillingDatePassed(currentBillingDate)) {
    currentBillingDate = calculateNextBillingDate(currentBillingDate, subscription.billing_cycle);
  }
  
  return {
    ...subscription,
    next_billing_date: currentBillingDate,
    was_updated: currentBillingDate !== subscription.next_billing_date
  };
};

/**
 * Process an array of subscriptions and preview date updates
 * Used for immediate UI feedback while API updates happen in background
 * @param {Array} subscriptions - Array of subscription objects
 * @returns {Object} { processedSubscriptions, hasUpdates: boolean }
 */
export const previewSubscriptionUpdates = (subscriptions) => {
  if (!subscriptions || !Array.isArray(subscriptions)) {
    return { processedSubscriptions: [], hasUpdates: false };
  }
  
  let hasUpdates = false;
  const processedSubscriptions = subscriptions.map(sub => {
    const preview = previewNextBillingDate(sub);
    if (preview.was_updated) {
      hasUpdates = true;
    }
    return preview;
  });
  
  return { processedSubscriptions, hasUpdates };
};

/**
 * Format days until billing for display with contextual styling
 * @param {number} days - Days until billing
 * @returns {Object} { text: string, urgent: boolean, overdue: boolean }
 */
export const formatDaysUntilBilling = (days) => {
  if (days < 0) {
    return {
      text: `${Math.abs(days)} days overdue`,
      urgent: true,
      overdue: true
    };
  } else if (days === 0) {
    return {
      text: 'Due today',
      urgent: true,
      overdue: false
    };
  } else if (days === 1) {
    return {
      text: 'Due tomorrow',
      urgent: true,
      overdue: false
    };
  } else if (days <= 3) {
    return {
      text: `Due in ${days} days`,
      urgent: true,
      overdue: false
    };
  } else if (days <= 7) {
    return {
      text: `${days} days`,
      urgent: false,
      overdue: false
    };
  } else {
    return {
      text: `${days} days`,
      urgent: false,
      overdue: false
    };
  }
};

/**
 * Get badge color class based on days until billing
 * @param {number} days - Days until billing
 * @returns {string} CSS class for badge color
 */
export const getBillingBadgeColor = (days) => {
  if (days < 0) {
    return 'badge-error'; // Overdue
  } else if (days <= 3) {
    return 'badge-error'; // Due soon
  } else if (days <= 7) {
    return 'badge-warning'; // Due this week
  } else {
    return 'badge-success'; // Due later
  }
};

/**
 * Get status indicator for subscription billing
 * @param {Object} subscription - Subscription object
 * @returns {Object} Status object with display info
 */
export const getSubscriptionStatus = (subscription) => {
  if (!subscription.is_active) {
    return {
      status: 'inactive',
      text: 'Inactive',
      badgeClass: 'badge-ghost',
      days: null
    };
  }
  
  const days = getDaysUntilBilling(subscription.next_billing_date);
  const formatted = formatDaysUntilBilling(days);
  
  return {
    status: formatted.overdue ? 'overdue' : formatted.urgent ? 'urgent' : 'normal',
    text: formatted.text,
    badgeClass: getBillingBadgeColor(days),
    days: days,
    urgent: formatted.urgent,
    overdue: formatted.overdue
  };
};

/**
 * Calculate total monthly cost for subscriptions
 * @param {Array} subscriptions - Array of subscription objects
 * @param {boolean} activeOnly - Only include active subscriptions
 * @returns {number} Total monthly cost
 */
export const calculateMonthlyTotal = (subscriptions, activeOnly = true) => {
  if (!subscriptions || !Array.isArray(subscriptions)) {
    return 0;
  }
  
  return subscriptions
    .filter(sub => !activeOnly || sub.is_active)
    .reduce((total, sub) => {
      const amount = parseFloat(sub.amount) || 0;
      
      switch (sub.billing_cycle) {
        case 'daily':
          return total + (amount * 30.44); // Average days per month
        case 'weekly':
          return total + (amount * 4.33); // Average weeks per month
        case 'monthly':
          return total + amount;
        case 'yearly':
          return total + (amount / 12);
        default:
          return total + amount; // Default to monthly
      }
    }, 0);
};

/**
 * Calculate total yearly cost for subscriptions
 * @param {Array} subscriptions - Array of subscription objects
 * @param {boolean} activeOnly - Only include active subscriptions
 * @returns {number} Total yearly cost
 */
export const calculateYearlyTotal = (subscriptions, activeOnly = true) => {
  if (!subscriptions || !Array.isArray(subscriptions)) {
    return 0;
  }
  
  return subscriptions
    .filter(sub => !activeOnly || sub.is_active)
    .reduce((total, sub) => {
      const amount = parseFloat(sub.amount) || 0;
      
      switch (sub.billing_cycle) {
        case 'daily':
          return total + (amount * 365);
        case 'weekly':
          return total + (amount * 52);
        case 'monthly':
          return total + (amount * 12);
        case 'yearly':
          return total + amount;
        default:
          return total + (amount * 12); // Default to monthly
      }
    }, 0);
};

/**
 * Group subscriptions by their billing urgency
 * @param {Array} subscriptions - Array of subscription objects
 * @returns {Object} Grouped subscriptions
 */
export const groupSubscriptionsByUrgency = (subscriptions) => {
  if (!subscriptions || !Array.isArray(subscriptions)) {
    return {
      overdue: [],
      urgent: [],
      normal: [],
      inactive: []
    };
  }
  
  const groups = {
    overdue: [],
    urgent: [],
    normal: [],
    inactive: []
  };
  
  subscriptions.forEach(sub => {
    const status = getSubscriptionStatus(sub);
    groups[status.status].push({
      ...sub,
      statusInfo: status
    });
  });
  
  // Sort each group by billing date
  Object.keys(groups).forEach(key => {
    if (key !== 'inactive') {
      groups[key].sort((a, b) => 
        new Date(a.next_billing_date) - new Date(b.next_billing_date)
      );
    }
  });
  
  return groups;
};

/**
 * Check if subscriptions need a refresh from the server
 * This can be used to trigger API calls when dates might be stale
 * @param {Array} subscriptions - Array of subscription objects
 * @param {number} staleThresholdHours - Hours after which to consider data stale
 * @returns {boolean} True if refresh is recommended
 */
export const shouldRefreshSubscriptions = (subscriptions, staleThresholdHours = 24) => {
  if (!subscriptions || !Array.isArray(subscriptions)) {
    return true;
  }
  
  // Check if any subscription has a past due date
  const hasOverdueSubscriptions = subscriptions.some(sub => 
    sub.is_active && getDaysUntilBilling(sub.next_billing_date) < 0
  );
  
  if (hasOverdueSubscriptions) {
    return true;
  }
  
  // Check if data is stale (you'd need to track fetch time)
  // This is a placeholder for cache invalidation logic
  const now = new Date();
  const staleTime = new Date(now.getTime() - (staleThresholdHours * 60 * 60 * 1000));
  
  // If you store fetch timestamp, compare it here
  // For now, we'll assume fresh data
  return false;
};