const { pool } = require("../config/database");

async function listFeaturedItems({ include_inactive = false } = {}) {
  const where = include_inactive ? [] : [`is_active = 1`];
  const [rows] = await pool.execute(
    `SELECT f.*, c.clinic_name AS resolved_clinic_name
     FROM platform_featured_items f
     LEFT JOIN clinics c ON c.id = f.clinic_id
     ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
     ORDER BY f.sort_order ASC, f.id ASC`,
  );
  return rows;
}

async function listFeaturedItemsAdmin() {
  const [rows] = await pool.execute(
    `SELECT f.*, c.clinic_name AS resolved_clinic_name
     FROM platform_featured_items f
     LEFT JOIN clinics c ON c.id = f.clinic_id
     ORDER BY f.is_active DESC, f.sort_order ASC, f.id ASC`,
  );
  return rows;
}

async function getById(id) {
  const [rows] = await pool.execute(
    `SELECT f.*, c.clinic_name AS resolved_clinic_name
     FROM platform_featured_items f
     LEFT JOIN clinics c ON c.id = f.clinic_id
     WHERE f.id = ? LIMIT 1`,
    [id],
  );
  return rows[0] || null;
}

async function insertFeatured(row) {
  const [r] = await pool.execute(
    `INSERT INTO platform_featured_items (
      item_type, clinic_id, article_title, article_excerpt, article_url, sort_order, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      row.item_type,
      row.clinic_id ?? null,
      row.article_title ?? null,
      row.article_excerpt ?? null,
      row.article_url ?? null,
      row.sort_order ?? 0,
      row.is_active ? 1 : 0,
    ],
  );
  return getById(r.insertId);
}

async function updateFeatured(id, patch) {
  const allowed = ["clinic_id", "article_title", "article_excerpt", "article_url", "sort_order", "is_active"];
  const fields = [];
  const values = [];
  for (const k of allowed) {
    if (patch[k] !== undefined) {
      fields.push(`${k} = ?`);
      if (k === "is_active") values.push(patch[k] ? 1 : 0);
      else values.push(patch[k]);
    }
  }
  if (fields.length === 0) return getById(id);
  values.push(id);
  await pool.execute(`UPDATE platform_featured_items SET ${fields.join(", ")} WHERE id = ?`, values);
  return getById(id);
}

async function deleteFeatured(id) {
  await pool.execute(`DELETE FROM platform_featured_items WHERE id = ?`, [id]);
}

module.exports = {
  listFeaturedItems,
  listFeaturedItemsAdmin,
  getById,
  insertFeatured,
  updateFeatured,
  deleteFeatured,
};
