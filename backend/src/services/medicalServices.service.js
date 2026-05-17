const { pool } = require("../config/database");
const { AppError } = require("../utils/appError");
const { sqlLimitOffset } = require("../utils/paginationSql");
const { assertClinicOwner } = require("./clinics.service");

function normalizeConsultationType(value) {
  const t = String(value ?? "in_person")
    .trim()
    .toLowerCase();
  if (!["online", "in_person"].includes(t)) {
    throw new AppError(400, "consultation_type нь online эсвэл in_person байна.");
  }
  return t;
}

function normalizeDuration(value) {
  const n = Number(value ?? 30);
  if (!Number.isInteger(n) || n < 5 || n > 240) {
    throw new AppError(400, "duration_minutes 5-240 хооронд байна.");
  }
  return n;
}

function normalizePrice(value) {
  const n = Number(value ?? 0);
  if (Number.isNaN(n) || n < 0) {
    throw new AppError(400, "Үнэ 0 эсвэл түүнээс их байна.");
  }
  return n;
}

async function assertServiceOwned(serviceId, ownerUserId) {
  const [rows] = await pool.execute(
    `SELECT s.id FROM services s
     INNER JOIN clinics c ON c.id = s.clinic_id
     WHERE s.id = ? AND c.owner_user_id = ? LIMIT 1`,
    [serviceId, ownerUserId],
  );
  if (!rows[0]) {
    throw new AppError(403, "Үйлчилгээний мэдээлэл засах эрхгүй.");
  }
}

async function createService(ownerUserId, body) {
  const {
    clinic_id,
    doctor_id,
    service_name,
    category,
    description,
    price,
    is_free_consultation,
    duration_minutes,
    consultation_type,
    is_active,
  } = body;
  if (!clinic_id || !service_name || !category) {
    throw new AppError(400, "clinic_id, service_name, category заавал.");
  }
  await assertClinicOwner(clinic_id, ownerUserId);
  if (doctor_id) {
    const [d] = await pool.execute(`SELECT id FROM doctors WHERE id = ? AND clinic_id = ? LIMIT 1`, [
      doctor_id,
      clinic_id,
    ]);
    if (!d[0]) {
      throw new AppError(400, "Эмч энэ эмнэлэгт харьяалагдах ёстой.");
    }
  }
  const duration = normalizeDuration(duration_minutes);
  const normalizedPrice = normalizePrice(price);
  const consultationType = normalizeConsultationType(consultation_type);
  const activeStatus = is_active === undefined ? 1 : is_active ? 1 : 0;
  const [result] = await pool.execute(
    `INSERT INTO services (
      clinic_id, doctor_id, service_name, category, description, price, is_free_consultation, duration_minutes, consultation_type, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      clinic_id,
      doctor_id ?? null,
      service_name,
      category,
      description ?? null,
      normalizedPrice,
      is_free_consultation === true || is_free_consultation === 1 ? 1 : 0,
      duration,
      consultationType,
      activeStatus,
    ],
  );
  return getServiceById(result.insertId);
}

function buildServiceListWhere(listQuery) {
  const where = [`1=1`];
  const params = [];
  if (listQuery.clinic_id) {
    where.push(`clinic_id = ?`);
    params.push(listQuery.clinic_id);
  }
  if (listQuery.doctor_id) {
    where.push(`doctor_id = ?`);
    params.push(listQuery.doctor_id);
  }
  return { where, params };
}

async function listServices(listQuery) {
  const { where, params } = buildServiceListWhere(listQuery);
  const ws = where.join(" AND ");
  const [[countRow]] = await pool.execute(`SELECT COUNT(*) AS c FROM services WHERE ${ws}`, params);
  const total = Number(countRow?.c || 0);
  const sortCol = listQuery.sortBy === "service_name" ? "service_name" : "created_at";
  const dir = listQuery.sortDir === "ASC" ? "ASC" : "DESC";
  const [rows] = await pool.execute(
    `SELECT
        id, clinic_id, doctor_id, service_name, category, description, price, is_free_consultation,
        duration_minutes, consultation_type, is_active, created_at
     FROM services WHERE ${ws}
     ORDER BY ${sortCol} ${dir}
     ${sqlLimitOffset(listQuery)}`,
    params,
  );
  return { items: rows, total };
}

async function getServiceById(id) {
  const [rows] = await pool.execute(
    `SELECT
      id, clinic_id, doctor_id, service_name, category, description, price, is_free_consultation,
      duration_minutes, consultation_type, is_active, created_at
     FROM services WHERE id = ? LIMIT 1`,
    [id],
  );
  if (!rows[0]) {
    throw new AppError(404, "Үйлчилгээ олдсонгүй.");
  }
  return rows[0];
}

async function updateService(serviceId, ownerUserId, body) {
  await assertServiceOwned(serviceId, ownerUserId);
  const fields = [];
  const values = [];
  const allowed = [
    "doctor_id",
    "service_name",
    "category",
    "description",
    "price",
    "is_free_consultation",
    "duration_minutes",
    "consultation_type",
    "is_active",
  ];
  for (const key of allowed) {
    if (body[key] !== undefined) {
      fields.push(`${key} = ?`);
      if (key === "is_free_consultation" || key === "is_active") {
        values.push(body[key] ? 1 : 0);
      } else if (key === "duration_minutes") {
        values.push(normalizeDuration(body[key]));
      } else if (key === "price") {
        values.push(normalizePrice(body[key]));
      } else if (key === "consultation_type") {
        values.push(normalizeConsultationType(body[key]));
      } else {
        values.push(body[key]);
      }
    }
  }
  if (fields.length === 0) {
    throw new AppError(400, "Шинэчлэх талбар байхгүй байна.");
  }
  values.push(serviceId);
  await pool.execute(`UPDATE services SET ${fields.join(", ")} WHERE id = ?`, values);
  return getServiceById(serviceId);
}

async function deleteService(serviceId, ownerUserId) {
  await assertServiceOwned(serviceId, ownerUserId);
  await pool.execute(`DELETE FROM services WHERE id = ?`, [serviceId]);
  return { id: Number(serviceId), deleted: true };
}

module.exports = { createService, listServices, getServiceById, updateService, deleteService };
