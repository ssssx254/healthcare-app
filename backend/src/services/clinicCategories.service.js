const { pool } = require("../config/database");
const { AppError } = require("../utils/appError");
const { assertClinicOwner } = require("./clinics.service");

function normalizeCategoryName(name) {
  const trimmed = String(name ?? "").trim();
  if (trimmed.length < 1) {
    throw new AppError(400, "Ангиллын нэр заавал.");
  }
  if (trimmed.length > 128) {
    throw new AppError(400, "Ангиллын нэр хэт урт байна.");
  }
  return trimmed;
}

async function listPublicCategoryNames() {
  const [rows] = await pool.execute(
    `SELECT DISTINCT name FROM (
       SELECT TRIM(s.category) AS name
       FROM services s
       INNER JOIN clinics c ON c.id = s.clinic_id
       WHERE c.approval_status = 'approved'
         AND (s.is_active = 1 OR s.is_active IS NULL)
         AND TRIM(s.category) <> ''
       UNION
       SELECT TRIM(cc.name) AS name
       FROM clinic_service_categories cc
       INNER JOIN clinics c ON c.id = cc.clinic_id
       WHERE c.approval_status = 'approved'
         AND TRIM(cc.name) <> ''
     ) AS combined
     ORDER BY name ASC`,
  );
  return rows.map((r) => String(r.name));
}

async function listClinicCategories(clinicId) {
  const [rows] = await pool.execute(
    `SELECT id, clinic_id, name, created_at
     FROM clinic_service_categories
     WHERE clinic_id = ?
     ORDER BY name ASC`,
    [clinicId],
  );
  return rows;
}

async function addClinicCategory(clinicId, ownerUserId, name) {
  await assertClinicOwner(clinicId, ownerUserId);
  const normalized = normalizeCategoryName(name);
  const [existing] = await pool.execute(
    `SELECT id FROM clinic_service_categories
     WHERE clinic_id = ? AND LOWER(name) = LOWER(?) LIMIT 1`,
    [clinicId, normalized],
  );
  if (existing[0]) {
    return existing[0];
  }
  const [result] = await pool.execute(
    `INSERT INTO clinic_service_categories (clinic_id, name) VALUES (?, ?)`,
    [clinicId, normalized],
  );
  const [rows] = await pool.execute(
    `SELECT id, clinic_id, name, created_at FROM clinic_service_categories WHERE id = ? LIMIT 1`,
    [result.insertId],
  );
  return rows[0];
}

async function removeClinicCategory(clinicId, categoryId, ownerUserId) {
  await assertClinicOwner(clinicId, ownerUserId);
  const [rows] = await pool.execute(
    `SELECT id FROM clinic_service_categories WHERE id = ? AND clinic_id = ? LIMIT 1`,
    [categoryId, clinicId],
  );
  if (!rows[0]) {
    throw new AppError(404, "Ангилал олдсонгүй.");
  }
  await pool.execute(`DELETE FROM clinic_service_categories WHERE id = ?`, [categoryId]);
  return { id: categoryId };
}

module.exports = {
  listPublicCategoryNames,
  listClinicCategories,
  addClinicCategory,
  removeClinicCategory,
};
