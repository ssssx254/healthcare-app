const { pool } = require("../config/database");
const { AppError } = require("../utils/appError");
const { sqlLimitOffset } = require("../utils/paginationSql");
const { assertPositiveIntId, optionalTrimmedString } = require("../utils/validation");
const { assertClinicOwner } = require("./clinics.service");

async function assertDoctorInOwnedClinic(doctorId, ownerUserId) {
  const [rows] = await pool.execute(
    `SELECT d.id FROM doctors d
     INNER JOIN clinics c ON c.id = d.clinic_id
     WHERE d.id = ? AND c.owner_user_id = ? LIMIT 1`,
    [doctorId, ownerUserId],
  );
  if (!rows[0]) {
    throw new AppError(403, "Эмчийн мэдээлэл засах эрхгүй.");
  }
}

function assertDoctorFullName(v) {
  if (typeof v !== "string" || v.trim().length < 2) {
    throw new AppError(400, "Эмчийн нэр хамгийн багадаа 2 тэмдэгт байна.");
  }
  return v.trim().slice(0, 120);
}

function assertSpecialization(v) {
  if (typeof v !== "string" || v.trim().length < 2) {
    throw new AppError(400, "Мэргэшил хамгийн багадаа 2 тэмдэгт байна.");
  }
  return v.trim().slice(0, 120);
}

function optionalShortText(v, maxLen = 191) {
  if (v === undefined || v === null || String(v).trim() === "") return null;
  return String(v).trim().slice(0, maxLen);
}

function normalizeExperienceYears(v) {
  if (v === undefined || v === null || v === "") {
    return null;
  }
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0 || n > 60) {
    throw new AppError(400, "Ажлын туршлага 0–60 жилийн хооронд байна.");
  }
  return n;
}

async function createDoctor(ownerUserId, body) {
  const {
    clinic_id,
    full_name,
    specialization,
    title,
    bio,
    education,
    work_history,
    experience_years,
    profile_image,
  } = body;
  const cid = assertPositiveIntId(clinic_id, "clinic_id");
  const fname = assertDoctorFullName(full_name);
  const spec = assertSpecialization(specialization);
  const titleValue = optionalShortText(title);
  const bioTrim = optionalTrimmedString(bio, 2000);
  const educationValue = optionalTrimmedString(education, 4000);
  const workHistoryValue = optionalTrimmedString(work_history, 4000);
  const exp = normalizeExperienceYears(experience_years);
  const img = optionalTrimmedString(profile_image, 2048);
  await assertClinicOwner(cid, ownerUserId);
  const [result] = await pool.execute(
    `INSERT INTO doctors (
      clinic_id, full_name, specialization, title, bio, education, work_history, experience_years, profile_image
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [cid, fname, spec, titleValue, bioTrim, educationValue, workHistoryValue, exp, img],
  );
  return getDoctorById(result.insertId);
}

/**
 * @param {object} listQuery — validateDoctorsListQuery / validateAdminDoctorsListQuery
 * @param {{ admin?: boolean }} [opts] admin=true бол бүх эмнэлгийн эмч; false бол зөвхөн баталгаажсан эмнэлэг
 */
async function listDoctors(listQuery, opts = {}) {
  const admin = Boolean(opts.admin);
  const where = [];
  const params = [];
  if (!admin) {
    where.push(`c.approval_status = 'approved'`);
  } else {
    where.push(`1=1`);
  }
  if (listQuery.clinic_id) {
    where.push(`d.clinic_id = ?`);
    params.push(listQuery.clinic_id);
  }
  if (listQuery.specialty) {
    where.push(`d.specialization LIKE ?`);
    params.push(`%${listQuery.specialty}%`);
  }
  const whereSql = where.join(" AND ");
  const join = `doctors d INNER JOIN clinics c ON c.id = d.clinic_id`;
  const sortMap = {
    created_at: "d.created_at",
    full_name: "d.full_name",
    specialization: "d.specialization",
  };
  const sortCol = sortMap[listQuery.sortBy] || "d.created_at";
  const dir = listQuery.sortDir === "ASC" ? "ASC" : "DESC";
  const countSql = `SELECT COUNT(*) AS c FROM ${join} WHERE ${whereSql}`;
  const [[countRow]] = await pool.execute(countSql, params);
  const total = Number(countRow?.c || 0);
  const extraCols = admin ? `, c.owner_user_id AS clinic_owner_user_id` : "";
  const [rows] = await pool.execute(
    `SELECT d.id, d.clinic_id, d.full_name, d.specialization, d.title, d.bio, d.education, d.work_history,
            d.experience_years, d.profile_image, d.created_at,
            c.clinic_name, c.approval_status AS clinic_approval_status${extraCols}
     FROM ${join}
     WHERE ${whereSql}
     ORDER BY ${sortCol} ${dir}
     ${sqlLimitOffset(listQuery, { max: 200 })}`,
    params,
  );
  return { items: rows, total };
}

async function getDoctorById(id) {
  const [rows] = await pool.execute(
    `SELECT id, clinic_id, full_name, specialization, title, bio, education, work_history, experience_years, profile_image, created_at
     FROM doctors WHERE id = ? LIMIT 1`,
    [id],
  );
  if (!rows[0]) {
    throw new AppError(404, "Эмч олдсонгүй.");
  }
  return rows[0];
}

async function updateDoctor(doctorId, ownerUserId, body) {
  await assertDoctorInOwnedClinic(doctorId, ownerUserId);
  const fields = [];
  const values = [];
  const allowed = [
    "full_name",
    "specialization",
    "title",
    "bio",
    "education",
    "work_history",
    "experience_years",
    "profile_image",
  ];
  for (const key of allowed) {
    if (body[key] !== undefined) {
      fields.push(`${key} = ?`);
      if (key === "full_name") values.push(assertDoctorFullName(body[key]));
      else if (key === "specialization") values.push(assertSpecialization(body[key]));
      else if (key === "experience_years") values.push(normalizeExperienceYears(body[key]));
      else if (key === "title") values.push(optionalShortText(body[key]));
      else if (key === "bio") values.push(optionalTrimmedString(body[key], 2000));
      else if (key === "education") values.push(optionalTrimmedString(body[key], 4000));
      else if (key === "work_history") values.push(optionalTrimmedString(body[key], 4000));
      else if (key === "profile_image") values.push(optionalTrimmedString(body[key], 2048));
      else values.push(body[key]);
    }
  }
  if (fields.length === 0) {
    throw new AppError(400, "Шинэчлэх талбар байхгүй байна.");
  }
  values.push(doctorId);
  await pool.execute(`UPDATE doctors SET ${fields.join(", ")} WHERE id = ?`, values);
  return getDoctorById(doctorId);
}

module.exports = { createDoctor, listDoctors, getDoctorById, updateDoctor };
