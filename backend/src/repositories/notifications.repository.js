const { pool } = require("../config/database");
const { sqlLimitOffsetPair } = require("../utils/paginationSql");

async function insertNotification(row) {
  let metadataJson = null;
  if (row.metadata != null) {
    metadataJson = typeof row.metadata === "string" ? row.metadata : JSON.stringify(row.metadata);
  }
  const [r] = await pool.execute(
    `INSERT INTO notifications (user_id, title, body, type, reference_type, reference_id, metadata, is_read)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      row.user_id,
      row.title,
      row.body,
      row.type,
      row.reference_type ?? null,
      row.reference_id ?? null,
      metadataJson,
    ],
  );
  return getNotificationById(r.insertId);
}

async function getNotificationById(id) {
  const [rows] = await pool.execute(`SELECT * FROM notifications WHERE id = ? LIMIT 1`, [id]);
  if (!rows[0]) return null;
  const row = rows[0];
  if (row.metadata && typeof row.metadata === "string") {
    try {
      row.metadata = JSON.parse(row.metadata);
    } catch {
      /* keep string */
    }
  }
  return row;
}

function buildNotificationListWhere(userId, { is_read, type } = {}) {
  const where = [`user_id = ?`];
  const params = [userId];
  if (is_read === "0" || is_read === "1" || is_read === 0 || is_read === 1) {
    where.push(`is_read = ?`);
    params.push(Number(is_read) ? 1 : 0);
  }
  if (type) {
    where.push(`type = ?`);
    params.push(String(type));
  }
  return { where, params };
}

async function countNotificationsForUser(userId, filters = {}) {
  const { where, params } = buildNotificationListWhere(userId, filters);
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS c FROM notifications WHERE ${where.join(" AND ")}`,
    params,
  );
  return Number(rows[0]?.c || 0);
}

async function listNotificationsForUser(userId, { is_read, type, pageSize, offset } = {}) {
  const { where, params } = buildNotificationListWhere(userId, { is_read, type });
  const [rows] = await pool.execute(
    `SELECT id, user_id, title, body, type, reference_type, reference_id, metadata, is_read, created_at
     FROM notifications WHERE ${where.join(" AND ")}
     ORDER BY created_at DESC
     ${sqlLimitOffsetPair(pageSize, offset)}`,
    params,
  );
  return rows.map((row) => {
    if (row.metadata && typeof row.metadata === "string") {
      try {
        row.metadata = JSON.parse(row.metadata);
      } catch {
        /* ignore */
      }
    }
    return row;
  });
}

async function countUnreadForUser(userId) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND is_read = 0`,
    [userId],
  );
  return Number(rows[0]?.n || 0);
}

async function markNotificationRead(notificationId, userId) {
  const [r] = await pool.execute(
    `UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`,
    [notificationId, userId],
  );
  return r.affectedRows > 0;
}

async function markAllNotificationsRead(userId) {
  await pool.execute(`UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0`, [userId]);
  return true;
}

module.exports = {
  insertNotification,
  getNotificationById,
  listNotificationsForUser,
  countNotificationsForUser,
  countUnreadForUser,
  markNotificationRead,
  markAllNotificationsRead,
};
