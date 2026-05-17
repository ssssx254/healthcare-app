const { pool } = require("../config/database");
const { sqlLimitOffsetPair } = require("../utils/paginationSql");

async function insertReport(row) {
  const [r] = await pool.execute(
    `INSERT INTO content_reports (reporter_user_id, target_type, target_id, reason_code, details)
     VALUES (?, ?, ?, ?, ?)`,
    [row.reporter_user_id, row.target_type, row.target_id ?? null, row.reason_code, row.details ?? null],
  );
  const [rows] = await pool.execute(`SELECT * FROM content_reports WHERE id = ? LIMIT 1`, [r.insertId]);
  return rows[0];
}

async function findReportById(id) {
  const [rows] = await pool.execute(`SELECT * FROM content_reports WHERE id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

async function countReportsForAdmin({ status } = {}) {
  const where = [];
  const params = [];
  if (status) {
    where.push(`cr.status = ?`);
    params.push(status);
  }
  const ws = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const [rows] = await pool.execute(`SELECT COUNT(*) AS c FROM content_reports cr ${ws}`, params);
  return Number(rows[0]?.c || 0);
}

async function listReportsForAdmin({ status, pageSize, offset } = {}) {
  const where = [];
  const params = [];
  if (status) {
    where.push(`cr.status = ?`);
    params.push(status);
  }
  const [rows] = await pool.execute(
    `SELECT cr.*,
            ur.full_name AS reporter_full_name,
            ur.email AS reporter_email
     FROM content_reports cr
     INNER JOIN users ur ON ur.id = cr.reporter_user_id
     ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
     ORDER BY cr.created_at DESC
     ${sqlLimitOffsetPair(pageSize, offset)}`,
    params,
  );
  return rows;
}

async function updateReportReview(id, { status, admin_notes, reviewed_by }) {
  await pool.execute(
    `UPDATE content_reports
     SET status = ?, admin_notes = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [status, admin_notes ?? null, reviewed_by, id],
  );
  return findReportById(id);
}

module.exports = {
  insertReport,
  findReportById,
  countReportsForAdmin,
  listReportsForAdmin,
  updateReportReview,
};
