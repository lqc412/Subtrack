import { query } from "../db.js";

export const getSubs = async() => {
    const {rows} = await query('SELECT * FROM subscriptions')
    return rows
}

export const createSubs = async(subsData) => {
    const { company, category, billing_cycle, next_billing_date, amount, currency, notes, is_active} = subsData
    const { rows } = await query(
        'INSERT INTO subscriptions (company, category, billing_cycle, next_billing_date, amount, currency, notes, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [company, category, billing_cycle, next_billing_date, amount, currency, notes, is_active]
    );
    return rows[0];
}

export const updateSubs = async(subsData, subsId) => {
    const { company, category, billing_cycle, next_billing_date, amount, currency, notes, is_active} = subsData
    const { rows } = await query(
        'UPDATE subscriptions SET company = $1, category = $2, billing_cycle = $3, next_billing_date = $4, amount = $5, currency = $6, notes = $7, is_active = $8 WHERE id = $9 RETURNING *',
        [company, category, billing_cycle, next_billing_date, amount, currency, notes, is_active, subsId]
    );
    return rows[0];
}

export const deleteSubs = async (SubsId) => {
    const { rowCount } = await query(`DELETE FROM subscriptions WHERE id = $1`, [SubsId]);
    return rowCount > 0;
};

export const searchSubs = async (searchTerm) => {
    const { rows } = await query(
      `SELECT * FROM subscriptions 
       WHERE company ILIKE $1 
          OR category ILIKE $1 
          OR notes ILIKE $1 
          OR CAST(amount AS TEXT) ILIKE $1`,
      [`%${searchTerm}%`]
    );
    return rows;
  };