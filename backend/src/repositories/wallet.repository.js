const { pool } = require("../config/database");
const { sqlLimitOffsetPair } = require("../utils/paginationSql");

async function ensureWallet(conn, userId) {
  const c = conn || pool;
  await c.execute(
    `INSERT IGNORE INTO wallets (user_id, balance) VALUES (?, 0.00)`,
    [userId],
  );
  const [rows] = await c.execute(`SELECT * FROM wallets WHERE user_id = ? LIMIT 1`, [userId]);
  return rows[0];
}

async function lockWalletForUpdate(conn, userId) {
  const [rows] = await conn.execute(`SELECT * FROM wallets WHERE user_id = ? FOR UPDATE`, [userId]);
  if (!rows[0]) {
    await conn.execute(`INSERT INTO wallets (user_id, balance) VALUES (?, 0.00)`, [userId]);
    const [r2] = await conn.execute(`SELECT * FROM wallets WHERE user_id = ? FOR UPDATE`, [userId]);
    return r2[0];
  }
  return rows[0];
}

async function updateWalletBalance(conn, userId, balance) {
  await conn.execute(`UPDATE wallets SET balance = ? WHERE user_id = ?`, [balance, userId]);
}

async function insertWalletTransaction(conn, row) {
  const c = conn || pool;
  const meta = row.metadata == null ? null : typeof row.metadata === "string" ? row.metadata : JSON.stringify(row.metadata);
  const [r] = await c.execute(
    `INSERT INTO wallet_transactions (
      user_id, direction, amount, balance_after, transaction_type,
      reference_type, reference_id, gateway_ref, metadata
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      row.user_id,
      row.direction,
      row.amount,
      row.balance_after,
      row.transaction_type,
      row.reference_type ?? null,
      row.reference_id ?? null,
      row.gateway_ref ?? null,
      meta,
    ],
  );
  const [rows] = await c.execute(`SELECT * FROM wallet_transactions WHERE id = ? LIMIT 1`, [r.insertId]);
  return rows[0];
}

async function countWalletTransactions(userId, { transaction_type } = {}) {
  const where = [`user_id = ?`];
  const params = [userId];
  if (transaction_type) {
    where.push(`transaction_type = ?`);
    params.push(transaction_type);
  }
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS c FROM wallet_transactions WHERE ${where.join(" AND ")}`,
    params,
  );
  return Number(rows[0]?.c || 0);
}

async function listWalletTransactions(userId, { transaction_type, pageSize, offset } = {}) {
  const where = [`user_id = ?`];
  const params = [userId];
  if (transaction_type) {
    where.push(`transaction_type = ?`);
    params.push(transaction_type);
  }
  const [rows] = await pool.execute(
    `SELECT * FROM wallet_transactions WHERE ${where.join(" AND ")}
     ORDER BY id DESC${sqlLimitOffsetPair(pageSize, offset)}`,
    params,
  );
  return rows;
}

async function findBookingPaymentTx(userId, bookingId, conn = pool) {
  const [rows] = await conn.execute(
    `SELECT id FROM wallet_transactions
     WHERE user_id = ? AND transaction_type = 'booking_payment' AND reference_type = 'booking' AND reference_id = ?
     LIMIT 1`,
    [userId, bookingId],
  );
  return rows[0] || null;
}

async function findBookingRefundTx(userId, bookingId, conn = pool) {
  const [rows] = await conn.execute(
    `SELECT id FROM wallet_transactions
     WHERE user_id = ? AND transaction_type = 'booking_refund' AND reference_type = 'booking' AND reference_id = ?
     LIMIT 1`,
    [userId, bookingId],
  );
  return rows[0] || null;
}

async function insertPaymentMethod(row) {
  const meta = row.metadata == null ? null : JSON.stringify(row.metadata);
  const [r] = await pool.execute(
    `INSERT INTO user_payment_methods (user_id, provider_code, label, masked_detail, is_default, metadata)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [row.user_id, row.provider_code, row.label, row.masked_detail ?? null, row.is_default ? 1 : 0, meta],
  );
  const [rows] = await pool.execute(`SELECT * FROM user_payment_methods WHERE id = ? LIMIT 1`, [r.insertId]);
  return rows[0];
}

async function listPaymentMethods(userId) {
  const [rows] = await pool.execute(
    `SELECT * FROM user_payment_methods WHERE user_id = ? ORDER BY is_default DESC, id DESC`,
    [userId],
  );
  return rows;
}

module.exports = {
  ensureWallet,
  lockWalletForUpdate,
  updateWalletBalance,
  insertWalletTransaction,
  countWalletTransactions,
  listWalletTransactions,
  findBookingPaymentTx,
  findBookingRefundTx,
  insertPaymentMethod,
  listPaymentMethods,
};
