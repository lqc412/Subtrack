import { query } from "../db.js";

/**
 * Get all subscriptions for a given user
 */
export const getSubs = async (userId) => {
  const { rows } = await query('SELECT * FROM subscriptions WHERE user_id = $1', [userId]);
  return rows;
};

/**
 * Get a single subscription by its ID
 */
export const getSubById = async (subId) => {
  const { rows } = await query('SELECT * FROM subscriptions WHERE id = $1', [subId]);
  return rows[0];
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
 * Search subscriptions for a given user using a keyword
 */
export const searchSubs = async (searchTerm, userId) => {
  const { rows } = await query(
    `SELECT * FROM subscriptions 
     WHERE user_id = $1 
     AND (company ILIKE $2 OR category ILIKE $2 OR notes ILIKE $2 OR CAST(amount AS TEXT) ILIKE $2)`,
    [userId, `%${searchTerm}%`]
  );
  return rows;
};

/**
 * Get subscriptions that are due within the next X days (default 30)
 */
export const getUpcomingSubscriptions = async (userId, days = 30) => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  const { rows } = await query(
    `SELECT * FROM subscriptions 
     WHERE user_id = $1 AND is_active = true AND next_billing_date <= $2
     ORDER BY next_billing_date ASC`,
    [userId, futureDate]
  );

  return rows;
};

/**
 * Get basic statistics for a user's subscriptions
 */
export const getSubscriptionStats = async (userId) => {
  const { rows } = await query(
    `SELECT 
      COUNT(*) as total_count,
      COUNT(CASE WHEN is_active = true THEN 1 END) as active_count,
      SUM(CASE WHEN is_active = true THEN amount ELSE 0 END) as total_active_amount,
      COUNT(DISTINCT category) as category_count
     FROM subscriptions 
     WHERE user_id = $1`,
    [userId]
  );

  return rows[0];
};

/**
 * Get active subscriptions grouped by category
 */
export const getSubscriptionsByCategory = async (userId) => {
  const { rows } = await query(
    `SELECT 
      COALESCE(category, 'Uncategorized') as category,
      COUNT(*) as subscription_count,
      SUM(CASE WHEN is_active = true THEN amount ELSE 0 END) as total_amount
     FROM subscriptions 
     WHERE user_id = $1 AND is_active = true
     GROUP BY category
     ORDER BY total_amount DESC`,
    [userId]
  );

  return rows;
};
