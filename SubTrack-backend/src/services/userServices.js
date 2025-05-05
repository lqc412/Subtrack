// src/services/userServices.js
import { query } from '../db.js';

// 通过ID获取用户
export const getUserById = async (id) => {
  try {
    const { rows } = await query('SELECT * FROM users WHERE id = $1', [id]);
    return rows[0];
  } catch (error) {
    console.error('获取用户出错:', error);
    throw error;
  }
};

// 更新用户信息
export const updateUser = async (userId, userData) => {
  const { username, email, profile_image } = userData;
  
  // 构建动态查询
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
  
  // 添加更新时间
  params.push(new Date());
  updates.push(`updated_at = $${params.length}`);
  
  // 添加WHERE条件
  params.push(userId);
  updateQuery += `${updates.join(', ')} WHERE id = $${params.length} RETURNING *`;
  
  try {
    const { rows } = await query(updateQuery, params);
    return rows[0];
  } catch (error) {
    console.error('更新用户出错:', error);
    throw error;
  }
};

// 更新用户密码
export const updatePassword = async (userId, hashedPassword) => {
  try {
    const { rows } = await query(
      'UPDATE users SET password_hash = $1, updated_at = $2 WHERE id = $3 RETURNING id',
      [hashedPassword, new Date(), userId]
    );
    return rows[0];
  } catch (error) {
    console.error('更新密码出错:', error);
    throw error;
  }
};

// 获取用户的所有订阅
export const getUserSubscriptions = async (userId) => {
  try {
    const { rows } = await query(
      'SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY next_billing_date ASC',
      [userId]
    );
    return rows;
  } catch (error) {
    console.error('获取用户订阅出错:', error);
    throw error;
  }
};