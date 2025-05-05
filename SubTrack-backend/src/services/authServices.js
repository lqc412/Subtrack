// src/services/authServices.js
import { query } from '../db.js';

// 通过邮箱查找用户
export const findUserByEmail = async (email) => {
  try {
    const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
    return rows[0];
  } catch (error) {
    console.error('查找用户出错:', error);
    throw error;
  }
};

// 通过ID查找用户
export const findUserById = async (id) => {
  try {
    const { rows } = await query('SELECT * FROM users WHERE id = $1', [id]);
    return rows[0];
  } catch (error) {
    console.error('查找用户出错:', error);
    throw error;
  }
};

// 创建新用户
export const createUser = async (userData) => {
  const { username, email, password_hash } = userData;
  try {
    const { rows } = await query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, password_hash]
    );
    return rows[0];
  } catch (error) {
    console.error('创建用户出错:', error);
    throw error;
  }
};

// 创建用户设置
export const createUserSettings = async (userId) => {
  try {
    const { rows } = await query(
      'INSERT INTO user_settings (user_id, theme_preference, currency_preference) VALUES ($1, $2, $3) RETURNING *',
      [userId, 'light', 'USD']
    );
    return rows[0];
  } catch (error) {
    console.error('创建用户设置出错:', error);
    throw error;
  }
};

// 存储令牌
export const storeToken = async (userId, token) => {
  try {
    // 设置令牌过期时间为7天后
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    const { rows } = await query(
      'INSERT INTO auth_tokens (user_id, token, expires_at) VALUES ($1, $2, $3) RETURNING id',
      [userId, token, expiresAt]
    );
    return rows[0];
  } catch (error) {
    console.error('存储令牌出错:', error);
    throw error;
  }
};

// 查找令牌
export const findToken = async (token) => {
  try {
    const { rows } = await query(
      'SELECT * FROM auth_tokens WHERE token = $1 AND expires_at > NOW()',
      [token]
    );
    return rows[0];
  } catch (error) {
    console.error('查找令牌出错:', error);
    throw error;
  }
};

// 删除令牌
export const deleteToken = async (token) => {
  try {
    await query('DELETE FROM auth_tokens WHERE token = $1', [token]);
    return true;
  } catch (error) {
    console.error('删除令牌出错:', error);
    throw error;
  }
};

// 获取用户设置
export const getUserSettings = async (userId) => {
  try {
    const { rows } = await query(
      'SELECT * FROM user_settings WHERE user_id = $1',
      [userId]
    );
    return rows[0];
  } catch (error) {
    console.error('获取用户设置出错:', error);
    throw error;
  }
};

// 更新用户设置
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
    console.error('更新用户设置出错:', error);
    throw error;
  }
};