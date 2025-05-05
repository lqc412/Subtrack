// src/services/subsServices.js
import { query } from "../db.js";

// 获取指定用户的所有订阅
export const getSubs = async(userId) => {
    const { rows } = await query('SELECT * FROM subscriptions WHERE user_id = $1', [userId]);
    return rows;
}

// 通过ID获取单个订阅
export const getSubById = async(subId) => {
    const { rows } = await query('SELECT * FROM subscriptions WHERE id = $1', [subId]);
    return rows[0];
}

// 创建新的订阅
export const createSubs = async(subsData) => {
    const { user_id, company, category, billing_cycle, next_billing_date, amount, currency, notes, is_active } = subsData;
    const { rows } = await query(
        'INSERT INTO subscriptions (user_id, company, category, billing_cycle, next_billing_date, amount, currency, notes, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
        [user_id, company, category, billing_cycle, next_billing_date, amount, currency, notes, is_active]
    );
    return rows[0];
}

// 更新订阅
export const updateSubs = async(subsData, subsId) => {
    const { company, category, billing_cycle, next_billing_date, amount, currency, notes, is_active } = subsData;
    const { rows } = await query(
        'UPDATE subscriptions SET company = $1, category = $2, billing_cycle = $3, next_billing_date = $4, amount = $5, currency = $6, notes = $7, is_active = $8 WHERE id = $9 RETURNING *',
        [company, category, billing_cycle, next_billing_date, amount, currency, notes, is_active, subsId]
    );
    return rows[0];
}

// 删除订阅
export const deleteSubs = async (subsId) => {
    const { rowCount } = await query(`DELETE FROM subscriptions WHERE id = $1`, [subsId]);
    return rowCount > 0;
};

// 搜索订阅
export const searchSubs = async (searchTerm, userId) => {
    const { rows } = await query(
      `SELECT * FROM subscriptions 
       WHERE user_id = $1 
       AND (company ILIKE $2 
          OR category ILIKE $2 
          OR notes ILIKE $2 
          OR CAST(amount AS TEXT) ILIKE $2)`,
      [userId, `%${searchTerm}%`]
    );
    return rows;
};

// 获取即将到期的订阅
export const getUpcomingSubscriptions = async (userId, days = 30) => {
  // 计算未来X天的日期
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  const { rows } = await query(
    `SELECT * FROM subscriptions 
     WHERE user_id = $1 
     AND is_active = true 
     AND next_billing_date <= $2
     ORDER BY next_billing_date ASC`,
    [userId, futureDate]
  );
  
  return rows;
};

// 获取订阅统计数据
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

// 获取按类别分组的订阅
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