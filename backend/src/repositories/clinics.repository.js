const { pool } = require("../config/database");

async function findClinicOwnedByUser(clinicId, userId) {
  const [rows] = await pool.execute(`SELECT id FROM clinics WHERE id = ? AND owner_user_id = ? LIMIT 1`, [
    clinicId,
    userId,
  ]);
  return rows[0] || null;
}

async function createClinic({
  owner_user_id,
  clinic_name,
  description,
  address,
  city,
  clinic_type,
  phone,
  email,
  approval_status,
}) {
  const [result] = await pool.execute(
    `INSERT INTO clinics (owner_user_id, clinic_name, description, address, city, clinic_type, phone, email, approval_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      owner_user_id,
      clinic_name,
      description,
      address,
      city ?? null,
      clinic_type ?? null,
      phone,
      email,
      approval_status || "pending",
    ],
  );
  return result.insertId;
}

async function findClinicById(id) {
  const [rows] = await pool.execute(
    `SELECT id, owner_user_id, clinic_name, description, address, city, clinic_type, phone, email, approval_status, created_at
     FROM clinics WHERE id = ? LIMIT 1`,
    [id],
  );
  return rows[0] || null;
}

async function listClinics() {
  const [rows] = await pool.execute(
    `SELECT id, owner_user_id, clinic_name, description, address, city, clinic_type, phone, email, approval_status, created_at
     FROM clinics ORDER BY created_at DESC`,
  );
  return rows;
}

async function countClinicsPublic(filters) {
  const { where, params } = buildClinicPublicWhere(filters);
  const [rows] = await pool.execute(`SELECT COUNT(*) AS c FROM clinics c WHERE ${where.join(" AND ")}`, params);
  return Number(rows[0]?.c || 0);
}

async function listClinicsPublicPaged(filters) {
  const { where, params } = buildClinicPublicWhere(filters);
  const sortCol = filters.sortBy === "clinic_name" ? "c.clinic_name" : "c.created_at";
  const dir = filters.sortDir === "ASC" ? "ASC" : "DESC";
  const lim = Math.max(1, Math.min(100, Math.floor(Number(filters.pageSize)) || 20));
  const off = Math.max(0, Math.floor(Number(filters.offset)) || 0);
  // LIMIT/OFFSET-ийг placeholder-оор биш тоогоор оруулна (зарим MariaDB/mysql2 хослолд ER_WRONG_ARGUMENTS гардаг).
  const [rows] = await pool.execute(
    `SELECT c.id, c.owner_user_id, c.clinic_name, c.description, c.address, c.city, c.clinic_type, c.phone, c.email,
            c.approval_status, c.created_at
     FROM clinics c
     WHERE ${where.join(" AND ")}
     ORDER BY ${sortCol} ${dir}
     LIMIT ${lim} OFFSET ${off}`,
    params,
  );
  return rows;
}

function buildClinicPublicWhere(filters) {
  const where = [`c.approval_status = 'approved'`];
  const params = [];
  if (filters.city) {
    where.push(`(c.city IS NOT NULL AND c.city LIKE ?)`);
    params.push(`%${filters.city}%`);
  }
  if (filters.clinic_type) {
    where.push(`(c.clinic_type IS NOT NULL AND c.clinic_type LIKE ?)`);
    params.push(`%${filters.clinic_type}%`);
  }
  if (filters.q) {
    where.push(`(c.clinic_name LIKE ? OR (c.description IS NOT NULL AND c.description LIKE ?))`);
    const p = `%${filters.q}%`;
    params.push(p, p);
  }
  return { where, params };
}

async function countClinicsForAdmin(filters = {}) {
  const { where, params } = buildClinicAdminWhere(filters);
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS c
     FROM clinics c
     INNER JOIN users u ON u.id = c.owner_user_id
     WHERE ${where.join(" AND ")}`,
    params,
  );
  return Number(rows[0]?.c || 0);
}

async function listClinicsForAdminPaged(filters = {}) {
  const { where, params } = buildClinicAdminWhere(filters);
  const sortMap = {
    created_at: "c.created_at",
    clinic_name: "c.clinic_name",
    approval_status: "c.approval_status",
  };
  const sortCol = sortMap[filters.sortBy] || "c.created_at";
  const dir = filters.sortDir === "ASC" ? "ASC" : "DESC";
  const lim = Math.max(1, Math.min(100, Math.floor(Number(filters.pageSize)) || 20));
  const off = Math.max(0, Math.floor(Number(filters.offset)) || 0);
  const sql = `SELECT c.id, c.owner_user_id, c.clinic_name, c.description, c.address, c.city, c.clinic_type, c.phone, c.email,
                      c.approval_status, c.created_at,
                      u.full_name AS owner_full_name, u.email AS owner_email, u.onboarding_status AS owner_onboarding_status
               FROM clinics c
               INNER JOIN users u ON u.id = c.owner_user_id
               WHERE ${where.join(" AND ")}
               ORDER BY ${sortCol} ${dir}
               LIMIT ${lim} OFFSET ${off}`;
  const [rows] = await pool.execute(sql, params);
  return rows;
}

function buildClinicAdminWhere(filters) {
  const where = [`1=1`];
  const params = [];
  if (filters.approval_status) {
    where.push(`c.approval_status = ?`);
    params.push(filters.approval_status);
  }
  if (filters.city) {
    where.push(`(c.city IS NOT NULL AND c.city LIKE ?)`);
    params.push(`%${filters.city}%`);
  }
  if (filters.clinic_type) {
    where.push(`(c.clinic_type IS NOT NULL AND c.clinic_type LIKE ?)`);
    params.push(`%${filters.clinic_type}%`);
  }
  return { where, params };
}

async function updateClinicApprovalStatus(clinicId, approval_status) {
  await pool.execute(`UPDATE clinics SET approval_status = ? WHERE id = ?`, [approval_status, clinicId]);
}

async function findClinicByOwnerUserId(ownerUserId) {
  const [rows] = await pool.execute(
    `SELECT id, owner_user_id, clinic_name, description, address, city, clinic_type, phone, email, approval_status, created_at
     FROM clinics WHERE owner_user_id = ? LIMIT 1`,
    [ownerUserId],
  );
  return rows[0] || null;
}

async function updateClinicById(clinicId, patch) {
  const fields = Object.keys(patch);
  if (fields.length === 0) return;
  const setClause = fields.map((k) => `${k} = ?`).join(", ");
  const values = fields.map((k) => patch[k]);
  values.push(clinicId);
  await pool.execute(`UPDATE clinics SET ${setClause} WHERE id = ?`, values);
}

module.exports = {
  findClinicOwnedByUser,
  createClinic,
  findClinicById,
  listClinics,
  countClinicsPublic,
  listClinicsPublicPaged,
  countClinicsForAdmin,
  listClinicsForAdminPaged,
  updateClinicApprovalStatus,
  findClinicByOwnerUserId,
  updateClinicById,
};

