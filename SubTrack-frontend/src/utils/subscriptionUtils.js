// src/utils/subscriptionUtils.js
/**
 * Utility functions for managing subscription dates and billing cycles
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
 * Update a subscription's next billing date if it has passed
 * @param {Object} subscription - The subscription object
 * @returns {Object} Updated subscription object
 */
export const updateSubscriptionIfNeeded = (subscription) => {
  if (!subscription.is_active) {
    return subscription;
  }
  
  let updatedSubscription = { ...subscription };
  let currentBillingDate = subscription.next_billing_date;
  
  // Keep advancing the date until it's in the future
  while (isBillingDatePassed(currentBillingDate)) {
    currentBillingDate = calculateNextBillingDate(currentBillingDate, subscription.billing_cycle);
    updatedSubscription.next_billing_date = currentBillingDate;
    updatedSubscription.needs_backend_update = true; // Flag for API update
  }
  
  return updatedSubscription;
};

/**
 * Process an array of subscriptions and update dates as needed
 * @param {Array} subscriptions - Array of subscription objects
 * @returns {Object} { updatedSubscriptions, needsUpdate: boolean }
 */
export const processSubscriptions = (subscriptions) => {
  if (!subscriptions || !Array.isArray(subscriptions)) {
    return { updatedSubscriptions: [], needsUpdate: false };
  }
  
  let needsUpdate = false;
  const updatedSubscriptions = subscriptions.map(sub => {
    const updated = updateSubscriptionIfNeeded(sub);
    if (updated.needs_backend_update) {
      needsUpdate = true;
    }
    return updated;
  });
  
  return { updatedSubscriptions, needsUpdate };
};

/**
 * Format days until billing for display
 * @param {number} days - Days until billing
 * @returns {string} Formatted string
 */
export const formatDaysUntilBilling = (days) => {
  if (days < 0) {
    return `${Math.abs(days)} days overdue`;
  } else if (days === 0) {
    return 'Today';
  } else if (days === 1) {
    return 'Tomorrow';
  } else {
    return `${days} days`;
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