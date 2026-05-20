const { pool } = require("../config/database");

const SELECT_FIELDS = `
  lt.id, lt.patient_user_id, lt.clinic_id, lt.doctor_id, lt.booking_id,
  lt.title, lt.test_type, lt.test_date, lt.description,
  lt.attachment_url, lt.attachment_type,
  lt.result_text, lt.result_file_url, lt.result_file_type,
  lt.doctor_notes, lt.status, lt.uploaded_by,
  lt.created_by_user_id, lt.reviewed_by_user_id, lt.reviewed_at,
  lt.created_at, lt.updated_at,
  c.clinic_name,
  d.full_name AS doctor_name`;

async function getById(id) {
  const [rows] = await pool.execute(
    `SELECT ${SELECT_FIELDS}
     FROM lab_tests lt
     LEFT JOIN clinics c ON c.id = lt.clinic_id
     LEFT JOIN doctors d ON d.id = lt.doctor_id
     WHERE lt.id = ? LIMIT 1`,
    [id],
  );
  return rows[0] || null;
}

async function insert(row) {
  const [result] = await pool.execute(
    `INSERT INTO lab_tests (
      patient_user_id, clinic_id, doctor_id, booking_id,
      title, test_type, test_date, description,
      attachment_url, attachment_type,
      result_text, result_file_url, result_file_type,
      doctor_notes, status, uploaded_by, created_by_user_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      row.patient_user_id,
      row.clinic_id,
      row.doctor_id,
      row.booking_id,
      row.title,
      row.test_type,
      row.test_date,
      row.description,
      row.attachment_url,
      row.attachment_type,
      row.result_text,
      row.result_file_url,
      row.result_file_type,
      row.doctor_notes,
      row.status,
      row.uploaded_by,
      row.created_by_user_id,
    ],
  );
  return getById(result.insertId);
}

async function updateById(id, fields) {
  const sets = [];
  const values = [];
  for (const [key, val] of Object.entries(fields)) {
    sets.push(`${key} = ?`);
    values.push(val);
  }
  if (sets.length === 0) return getById(id);
  values.push(id);
  await pool.execute(`UPDATE lab_tests SET ${sets.join(", ")} WHERE id = ?`, values);
  return getById(id);
}

async function listForCustomer(patientUserId, { filter } = {}) {
  const where = ["lt.patient_user_id = ?"];
  const params = [patientUserId];
  if (filter === "mine") {
    where.push("lt.uploaded_by = 'customer'");
  } else if (filter === "clinic") {
    where.push("(lt.uploaded_by = 'clinic' OR (lt.clinic_id IS NOT NULL AND lt.status IN ('completed','reviewed')))");
  }
  const [rows] = await pool.execute(
    `SELECT ${SELECT_FIELDS}
     FROM lab_tests lt
     LEFT JOIN clinics c ON c.id = lt.clinic_id
     LEFT JOIN doctors d ON d.id = lt.doctor_id
     WHERE ${where.join(" AND ")}
     ORDER BY lt.test_date DESC, lt.created_at DESC`,
    params,
  );
  return rows;
}

async function listForProvider(providerUserId, { patient_user_id, clinic_id, doctor_id } = {}) {
  const where = [
    `EXISTS (
      SELECT 1 FROM bookings b
      INNER JOIN clinics c2 ON c2.id = b.clinic_id
      WHERE b.patient_user_id = lt.patient_user_id AND c2.owner_user_id = ?
    )`,
  ];
  const params = [providerUserId];
  if (patient_user_id) {
    where.push("lt.patient_user_id = ?");
    params.push(patient_user_id);
  }
  if (clinic_id) {
    where.push("lt.clinic_id = ?");
    params.push(clinic_id);
  }
  if (doctor_id) {
    where.push("lt.doctor_id = ?");
    params.push(doctor_id);
  }
  const [rows] = await pool.execute(
    `SELECT ${SELECT_FIELDS}
     FROM lab_tests lt
     LEFT JOIN clinics c ON c.id = lt.clinic_id
     LEFT JOIN doctors d ON d.id = lt.doctor_id
     WHERE ${where.join(" AND ")}
     ORDER BY lt.test_date DESC, lt.created_at DESC`,
    params,
  );
  return rows;
}

module.exports = {
  getById,
  insert,
  updateById,
  listForCustomer,
  listForProvider,
};
