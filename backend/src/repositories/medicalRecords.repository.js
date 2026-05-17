const { pool } = require("../config/database");

async function insertMedicalNote(row) {
  const [r] = await pool.execute(
    `INSERT INTO medical_notes (
      patient_user_id, clinic_id, doctor_id, booking_id,
      diagnosis, doctor_notes, recommendation, treatment_plan, created_by_user_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      row.patient_user_id,
      row.clinic_id,
      row.doctor_id,
      row.booking_id,
      row.diagnosis,
      row.doctor_notes,
      row.recommendation,
      row.treatment_plan,
      row.created_by_user_id,
    ],
  );
  return getMedicalNoteById(r.insertId);
}

async function getMedicalNoteById(id) {
  const [rows] = await pool.execute(`SELECT * FROM medical_notes WHERE id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

async function listMedicalNotesForPatient(patientUserId, providerUserId, filters = {}) {
  const where = [`n.patient_user_id = ?`, `c.owner_user_id = ?`];
  const params = [patientUserId, providerUserId];
  if (filters.clinic_id) {
    where.push(`n.clinic_id = ?`);
    params.push(filters.clinic_id);
  }
  if (filters.doctor_id) {
    where.push(`n.doctor_id = ?`);
    params.push(filters.doctor_id);
  }
  if (filters.booking_id) {
    where.push(`n.booking_id = ?`);
    params.push(filters.booking_id);
  }
  const [rows] = await pool.execute(
    `SELECT n.* FROM medical_notes n
     INNER JOIN clinics c ON c.id = n.clinic_id
     WHERE ${where.join(" AND ")}
     ORDER BY n.created_at DESC`,
    params,
  );
  return rows;
}

async function listMedicalNotesForCustomer(patientUserId) {
  const [rows] = await pool.execute(
    `SELECT * FROM medical_notes WHERE patient_user_id = ? ORDER BY created_at DESC`,
    [patientUserId],
  );
  return rows;
}

async function insertPrescription(row) {
  const [r] = await pool.execute(
    `INSERT INTO prescriptions (
      patient_user_id, clinic_id, doctor_id, booking_id,
      medicine_name, dosage, instructions, duration, created_by_user_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      row.patient_user_id,
      row.clinic_id,
      row.doctor_id,
      row.booking_id,
      row.medicine_name,
      row.dosage,
      row.instructions,
      row.duration,
      row.created_by_user_id,
    ],
  );
  return getPrescriptionById(r.insertId);
}

async function getPrescriptionById(id) {
  const [rows] = await pool.execute(`SELECT * FROM prescriptions WHERE id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

async function listPrescriptionsForPatient(patientUserId, providerUserId, filters = {}) {
  const where = [`p.patient_user_id = ?`, `c.owner_user_id = ?`];
  const params = [patientUserId, providerUserId];
  if (filters.clinic_id) {
    where.push(`p.clinic_id = ?`);
    params.push(filters.clinic_id);
  }
  if (filters.doctor_id) {
    where.push(`p.doctor_id = ?`);
    params.push(filters.doctor_id);
  }
  if (filters.booking_id) {
    where.push(`p.booking_id = ?`);
    params.push(filters.booking_id);
  }
  const [rows] = await pool.execute(
    `SELECT p.* FROM prescriptions p
     INNER JOIN clinics c ON c.id = p.clinic_id
     WHERE ${where.join(" AND ")}
     ORDER BY p.created_at DESC`,
    params,
  );
  return rows;
}

async function listPrescriptionsForCustomer(patientUserId) {
  const [rows] = await pool.execute(
    `SELECT * FROM prescriptions WHERE patient_user_id = ? ORDER BY created_at DESC`,
    [patientUserId],
  );
  return rows;
}

async function insertLabTestResult(row) {
  const [r] = await pool.execute(
    `INSERT INTO lab_test_results (
      patient_user_id, clinic_id, doctor_id, booking_id,
      title, file_placeholder, notes, source, created_by_user_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      row.patient_user_id,
      row.clinic_id,
      row.doctor_id,
      row.booking_id,
      row.title,
      row.file_placeholder,
      row.notes,
      row.source,
      row.created_by_user_id,
    ],
  );
  return getLabTestResultById(r.insertId);
}

async function getLabTestResultById(id) {
  const [rows] = await pool.execute(`SELECT * FROM lab_test_results WHERE id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

async function listLabResultsForPatient(patientUserId, providerUserId, filters = {}) {
  const where = [
    `l.patient_user_id = ?`,
    `(
      l.clinic_id IN (SELECT id FROM clinics WHERE owner_user_id = ?)
      OR (
        l.booking_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM bookings b
          INNER JOIN clinics c ON c.id = b.clinic_id
          WHERE b.id = l.booking_id AND c.owner_user_id = ?
        )
      )
    )`,
  ];
  const params = [patientUserId, providerUserId, providerUserId];
  if (filters.clinic_id) {
    where.push(`l.clinic_id = ?`);
    params.push(filters.clinic_id);
  }
  if (filters.doctor_id) {
    where.push(`l.doctor_id = ?`);
    params.push(filters.doctor_id);
  }
  if (filters.booking_id) {
    where.push(`l.booking_id = ?`);
    params.push(filters.booking_id);
  }
  const [rows] = await pool.execute(
    `SELECT l.* FROM lab_test_results l WHERE ${where.join(" AND ")} ORDER BY l.created_at DESC`,
    params,
  );
  return rows;
}

async function listLabResultsForCustomer(patientUserId) {
  const [rows] = await pool.execute(
    `SELECT * FROM lab_test_results WHERE patient_user_id = ? ORDER BY created_at DESC`,
    [patientUserId],
  );
  return rows;
}

module.exports = {
  insertMedicalNote,
  getMedicalNoteById,
  listMedicalNotesForPatient,
  listMedicalNotesForCustomer,
  insertPrescription,
  getPrescriptionById,
  listPrescriptionsForPatient,
  listPrescriptionsForCustomer,
  insertLabTestResult,
  getLabTestResultById,
  listLabResultsForPatient,
  listLabResultsForCustomer,
};
