const { pool } = require("../config/database");

async function listByUser(userId) {
  const [rows] = await pool.execute(
    `SELECT id, user_id, card_brand, card_last4, card_holder_name, expiry_month, expiry_year, is_default, created_at, updated_at
     FROM payment_methods WHERE user_id = ? ORDER BY is_default DESC, id DESC`,
    [userId],
  );
  return rows;
}

async function getByIdForUser(id, userId) {
  const [rows] = await pool.execute(
    `SELECT id, user_id, card_brand, card_last4, card_holder_name, expiry_month, expiry_year, is_default, created_at, updated_at
     FROM payment_methods WHERE id = ? AND user_id = ? LIMIT 1`,
    [id, userId],
  );
  return rows[0] || null;
}

async function insert(row) {
  if (row.is_default) {
    await pool.execute(`UPDATE payment_methods SET is_default = 0 WHERE user_id = ?`, [row.user_id]);
  }
  const [result] = await pool.execute(
    `INSERT INTO payment_methods (user_id, card_brand, card_last4, card_holder_name, expiry_month, expiry_year, is_default)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      row.user_id,
      row.card_brand,
      row.card_last4,
      row.card_holder_name,
      row.expiry_month,
      row.expiry_year,
      row.is_default ? 1 : 0,
    ],
  );
  return getByIdForUser(result.insertId, row.user_id);
}

async function setDefault(id, userId) {
  await pool.execute(`UPDATE payment_methods SET is_default = 0 WHERE user_id = ?`, [userId]);
  await pool.execute(`UPDATE payment_methods SET is_default = 1 WHERE id = ? AND user_id = ?`, [id, userId]);
  return getByIdForUser(id, userId);
}

async function remove(id, userId) {
  const [r] = await pool.execute(`DELETE FROM payment_methods WHERE id = ? AND user_id = ?`, [id, userId]);
  return r.affectedRows > 0;
}

async function countByUser(userId) {
  const [rows] = await pool.execute(`SELECT COUNT(*) AS c FROM payment_methods WHERE user_id = ?`, [userId]);
  return Number(rows[0]?.c || 0);
}

module.exports = {
  listByUser,
  getByIdForUser,
  insert,
  setDefault,
  remove,
  countByUser,
};
