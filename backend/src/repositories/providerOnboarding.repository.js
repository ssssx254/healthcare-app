const { pool } = require("../config/database");

async function findSubmissionByUserId(userId) {
  const [rows] = await pool.execute(
    `SELECT *
     FROM provider_onboarding_submissions
     WHERE user_id = ?
     LIMIT 1`,
    [userId],
  );
  return rows[0] || null;
}

async function upsertSubmissionByUserId(userId, payload) {
  const existing = await findSubmissionByUserId(userId);
  if (!existing) {
    const [result] = await pool.execute(
      `INSERT INTO provider_onboarding_submissions (
        user_id,
        manager_name,
        account_email,
        account_phone,
        clinic_name,
        clinic_type,
        introduction,
        logo_url,
        address,
        city,
        district,
        contact_phone,
        contact_email,
        working_hours,
        online_enabled,
        ambulatory_enabled,
        supported_specialties,
        status,
        admin_feedback
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NULL)`,
      [
        userId,
        payload.manager_name,
        payload.account_email,
        payload.account_phone,
        payload.clinic_name,
        payload.clinic_type,
        payload.introduction,
        payload.logo_url,
        payload.address,
        payload.city,
        payload.district,
        payload.contact_phone,
        payload.contact_email,
        payload.working_hours,
        payload.online_enabled ? 1 : 0,
        payload.ambulatory_enabled ? 1 : 0,
        payload.supported_specialties,
      ],
    );
    return getSubmissionById(result.insertId);
  }

  await pool.execute(
    `UPDATE provider_onboarding_submissions
     SET
      manager_name = ?,
      account_email = ?,
      account_phone = ?,
      clinic_name = ?,
      clinic_type = ?,
      introduction = ?,
      logo_url = ?,
      address = ?,
      city = ?,
      district = ?,
      contact_phone = ?,
      contact_email = ?,
      working_hours = ?,
      online_enabled = ?,
      ambulatory_enabled = ?,
      supported_specialties = ?,
      status = 'pending',
      admin_feedback = NULL,
      reviewed_by = NULL,
      reviewed_at = NULL,
      updated_at = CURRENT_TIMESTAMP
     WHERE user_id = ?`,
    [
      payload.manager_name,
      payload.account_email,
      payload.account_phone,
      payload.clinic_name,
      payload.clinic_type,
      payload.introduction,
      payload.logo_url,
      payload.address,
      payload.city,
      payload.district,
      payload.contact_phone,
      payload.contact_email,
      payload.working_hours,
      payload.online_enabled ? 1 : 0,
      payload.ambulatory_enabled ? 1 : 0,
      payload.supported_specialties,
      userId,
    ],
  );
  return findSubmissionByUserId(userId);
}

async function getSubmissionById(id) {
  const [rows] = await pool.execute(
    `SELECT *
     FROM provider_onboarding_submissions
     WHERE id = ?
     LIMIT 1`,
    [id],
  );
  return rows[0] || null;
}

async function listPendingSubmissions() {
  const [rows] = await pool.execute(
    `SELECT s.*,
            u.full_name AS provider_full_name,
            u.email AS provider_email,
            u.phone AS provider_phone,
            u.onboarding_status AS user_onboarding_status
     FROM provider_onboarding_submissions s
     INNER JOIN users u ON u.id = s.user_id
     WHERE s.status = 'pending' AND u.role = 'provider'
     ORDER BY s.created_at ASC`,
  );
  return rows;
}

/** Админ: `users.onboarding_status = pending` үзүүлэгч + сүүлийн илгээлт (pending эсвэл илгээлтгүй). */
async function listPendingProvidersForAdmin() {
  const [rows] = await pool.execute(
    `SELECT
       u.id AS provider_user_id,
       u.full_name AS provider_full_name,
       u.email AS provider_email,
       u.phone AS provider_phone,
       u.onboarding_status AS user_onboarding_status,
       u.created_at AS user_created_at,
       s.id AS submission_id,
       s.clinic_name,
       s.clinic_type,
       s.city,
       s.district,
       s.manager_name,
       s.introduction,
       s.status AS submission_status,
       s.created_at AS submission_created_at
     FROM users u
     LEFT JOIN provider_onboarding_submissions s
       ON s.user_id = u.id AND s.status = 'pending'
     WHERE u.role = 'provider' AND u.onboarding_status = 'pending'
     ORDER BY COALESCE(s.created_at, u.created_at) ASC`,
  );
  return rows;
}

async function reviewSubmission({ userId, reviewerId, status, feedback }) {
  await pool.execute(
    `UPDATE provider_onboarding_submissions
     SET status = ?, admin_feedback = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE user_id = ?`,
    [status, feedback, reviewerId, userId],
  );
  return findSubmissionByUserId(userId);
}

module.exports = {
  findSubmissionByUserId,
  upsertSubmissionByUserId,
  listPendingSubmissions,
  listPendingProvidersForAdmin,
  reviewSubmission,
};

