import { query } from '../db.js';

/**
 * Get user by ID
 */
export const getUserById = async (id) => {
  try {
    const { rows } = await query('SELECT * FROM users WHERE id = $1', [id]);
    return rows[0];
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    throw error;
  }
};

/**
 * Update user info (supports partial updates)
 */
export const updateUser = async (userId, userData) => {
  const { username, email, profile_image } = userData;

  let updateQuery = 'UPDATE users SET ';
  const params = [];
  const updates = [];

  if (username) {
    params.push(username);
    updates.push(`username = $${params.length}`);
  }

  if (email) {
    params.push(email);
    updates.push(`email = $${params.length}`);
  }

  if (profile_image) {
    params.push(profile_image);
    updates.push(`profile_image = $${params.length}`);
  }

  // Add updated_at field
  params.push(new Date());
  updates.push(`updated_at = $${params.length}`);

  // WHERE clause
  params.push(userId);
  updateQuery += `${updates.join(', ')} WHERE id = $${params.length} RETURNING *`;

  try {
    const { rows } = await query(updateQuery, params);
    return rows[0];
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

/**
 * Update user's password
 */
export const updatePassword = async (userId, hashedPassword) => {
  try {
    const { rows } = await query(
      'UPDATE users SET password_hash = $1, updated_at = $2 WHERE id = $3 RETURNING id',
      [hashedPassword, new Date(), userId]
    );
    return rows[0];
  } catch (error) {
    console.error('Error updating password:', error);
    throw error;
  }
};

/**
 * Get all subscriptions for a specific user
 */
export const getUserSubscriptions = async (userId) => {
  try {
    const { rows } = await query(
      'SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY next_billing_date ASC',
      [userId]
    );
    return rows;
  } catch (error) {
    console.error('Error fetching user subscriptions:', error);
    throw error;
  }
};
