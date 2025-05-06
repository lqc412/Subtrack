import { query } from '../db.js';

/**
 * Find user by email
 */
export const findUserByEmail = async (email) => {
  try {
    const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
    return rows[0];
  } catch (error) {
    console.error('Error finding user by email:', error);
    throw error;
  }
};

/**
 * Find user by ID
 */
export const findUserById = async (id) => {
  try {
    const { rows } = await query('SELECT * FROM users WHERE id = $1', [id]);
    return rows[0];
  } catch (error) {
    console.error('Error finding user by ID:', error);
    throw error;
  }
};

/**
 * Create a new user
 */
export const createUser = async (userData) => {
  const { username, email, password_hash } = userData;
  try {
    const { rows } = await query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, password_hash]
    );
    return rows[0];
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

/**
 * Create default user settings (e.g., theme and currency)
 */
export const createUserSettings = async (userId) => {
  try {
    const { rows } = await query(
      'INSERT INTO user_settings (user_id, theme_preference, currency_preference) VALUES ($1, $2, $3) RETURNING *',
      [userId, 'light', 'USD']
    );
    return rows[0];
  } catch (error) {
    console.error('Error creating user settings:', error);
    throw error;
  }
};

/**
 * Store auth token with expiration (7 days)
 */
export const storeToken = async (userId, token) => {
  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { rows } = await query(
      'INSERT INTO auth_tokens (user_id, token, expires_at) VALUES ($1, $2, $3) RETURNING id',
      [userId, token, expiresAt]
    );
    return rows[0];
  } catch (error) {
    console.error('Error storing token:', error);
    throw error;
  }
};

/**
 * Find valid (non-expired) token
 */
export const findToken = async (token) => {
  try {
    const { rows } = await query(
      'SELECT * FROM auth_tokens WHERE token = $1 AND expires_at > NOW()',
      [token]
    );
    return rows[0];
  } catch (error) {
    console.error('Error finding token:', error);
    throw error;
  }
};

/**
 * Delete token (logout)
 */
export const deleteToken = async (token) => {
  try {
    await query('DELETE FROM auth_tokens WHERE token = $1', [token]);
    return true;
  } catch (error) {
    console.error('Error deleting token:', error);
    throw error;
  }
};

/**
 * Get user settings
 */
export const getUserSettings = async (userId) => {
  try {
    const { rows } = await query(
      'SELECT * FROM user_settings WHERE user_id = $1',
      [userId]
    );
    return rows[0];
  } catch (error) {
    console.error('Error getting user settings:', error);
    throw error;
  }
};

/**
 * Update user settings
 */
export const updateUserSettings = async (userId, settings) => {
  const { theme_preference, currency_preference, notification_preferences } = settings;
  try {
    const { rows } = await query(
      `UPDATE user_settings 
       SET theme_preference = $1, 
           currency_preference = $2, 
           notification_preferences = $3 
       WHERE user_id = $4 
       RETURNING *`,
      [theme_preference, currency_preference, notification_preferences, userId]
    );
    return rows[0];
  } catch (error) {
    console.error('Error updating user settings:', error);
    throw error;
  }
};
