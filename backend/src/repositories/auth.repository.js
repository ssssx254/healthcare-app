const { pool } = require("../config/database");

async function createUser({ full_name, email, password_hash, role, phone, onboarding_status }) {
  const [result] = await pool.execute(
    `INSERT INTO users (full_name, email, password_hash, role, onboarding_status, phone)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [full_name, email, password_hash, role, onboarding_status, phone],
  );
  return result.insertId;
}

async function findUserById(id) {
  const [rows] = await pool.execute(
    `SELECT id, full_name, email, role, onboarding_status, phone, created_at
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [id],
  );
  return rows[0] || null;
}

async function findUserAuthByEmail(email) {
  const [rows] = await pool.execute(`SELECT * FROM users WHERE email = ? LIMIT 1`, [email]);
  return rows[0] || null;
}

async function findUserAuthByPhone(phoneRaw, phoneDigits) {
  const [rows] = await pool.execute(`SELECT * FROM users WHERE phone = ? OR phone = ? LIMIT 1`, [phoneRaw, phoneDigits]);
  return rows[0] || null;
}

async function updateUserPassword(userId, password_hash) {
  await pool.execute(`UPDATE users SET password_hash = ? WHERE id = ?`, [password_hash, userId]);
}

async function updateUserOnboardingStatus(userId, onboarding_status) {
  await pool.execute(`UPDATE users SET onboarding_status = ? WHERE id = ?`, [onboarding_status, userId]);
}

module.exports = {
  createUser,
  findUserById,
  findUserAuthByEmail,
  findUserAuthByPhone,
  updateUserPassword,
  updateUserOnboardingStatus,
};

