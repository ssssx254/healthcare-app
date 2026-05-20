const { pool } = require("../config/database");
const { AppError } = require("../utils/appError");
const { ROLES } = require("../constants/roles");

function assertRole(user, role, message) {
  if (!user || user.role !== role) {
    throw new AppError(403, message);
  }
}

async function getCustomerStats(user) {
  assertRole(user, ROLES.CUSTOMER, "Зөвхөн хэрэглэгч өөрийн статистикийг харна.");
  const [[bookingRow]] = await pool.execute(
    `SELECT
       COUNT(*) AS total_bookings,
       SUM(CASE WHEN b.status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed_bookings,
       SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END) AS completed_bookings,
       SUM(CASE WHEN b.status = 'cancelled' OR b.status LIKE 'cancelled_%' THEN 1 ELSE 0 END) AS cancelled_bookings,
       SUM(CASE WHEN b.status = 'pending' THEN 1 ELSE 0 END) AS pending_bookings,
       COALESCE(SUM(CASE WHEN b.payment_status = 'paid' THEN b.total_amount ELSE 0 END), 0) AS paid_amount_total
     FROM bookings b
     WHERE b.patient_user_id = ?`,
    [user.id],
  );

  const [[walletRow]] = await pool.execute(
    `SELECT COALESCE(w.balance, 0) AS wallet_balance
     FROM wallets w
     WHERE w.user_id = ?`,
    [user.id],
  );

  const [[chatRow]] = await pool.execute(
    `SELECT COUNT(*) AS online_consultations_count
     FROM chat_conversations c
     WHERE c.customer_user_id = ?`,
    [user.id],
  );

  return {
    total_bookings: Number(bookingRow?.total_bookings || 0),
    confirmed_bookings: Number(bookingRow?.confirmed_bookings || 0),
    completed_bookings: Number(bookingRow?.completed_bookings || 0),
    cancelled_bookings: Number(bookingRow?.cancelled_bookings || 0),
    pending_bookings: Number(bookingRow?.pending_bookings || 0),
    wallet_balance: Number(walletRow?.wallet_balance || 0),
    paid_amount_total: Number(bookingRow?.paid_amount_total || 0),
    online_consultations_count: Number(chatRow?.online_consultations_count || 0),
  };
}

async function getProviderStats(user) {
  assertRole(user, ROLES.PROVIDER, "Зөвхөн үйлчилгээ үзүүлэгч өөрийн статистикийг харна.");
  const [bookingRows] = await pool.execute(
    `SELECT
       COUNT(*) AS total_bookings,
       SUM(CASE WHEN b.status = 'pending' THEN 1 ELSE 0 END) AS pending_bookings,
       SUM(CASE WHEN b.status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed_bookings,
       SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END) AS completed_bookings,
       COALESCE(SUM(CASE WHEN b.payment_status = 'paid' AND b.status IN ('confirmed','completed') THEN b.total_amount ELSE 0 END), 0) AS revenue_total
     FROM bookings b
     INNER JOIN clinics c ON c.id = b.clinic_id
     WHERE c.owner_user_id = ?`,
    [user.id],
  );

  const [doctorRows] = await pool.execute(
    `SELECT COUNT(DISTINCT d.id) AS active_doctors
     FROM doctors d
     INNER JOIN clinics c ON c.id = d.clinic_id
     LEFT JOIN services s ON s.doctor_id = d.id AND s.is_active = 1
     WHERE c.owner_user_id = ?
       AND s.id IS NOT NULL`,
    [user.id],
  );

  const booking = bookingRows?.[0] || {};
  const doctors = doctorRows?.[0] || {};
  return {
    total_bookings: Number(booking.total_bookings || 0),
    pending: Number(booking.pending_bookings || 0),
    confirmed: Number(booking.confirmed_bookings || 0),
    completed: Number(booking.completed_bookings || 0),
    revenue_total: Number(booking.revenue_total || 0),
    active_doctors: Number(doctors.active_doctors || 0),
  };
}

async function getAdminStats(user) {
  assertRole(user, ROLES.SYSTEM_ADMIN, "Зөвхөн системийн админ платформын статистикийг харна.");
  const [[row]] = await pool.execute(
    `SELECT
       (SELECT COUNT(*) FROM users) AS total_users,
       (SELECT COUNT(*) FROM users WHERE role = 'provider') AS total_providers,
       (SELECT COUNT(*) FROM clinics WHERE approval_status = 'pending') AS pending_clinics,
       (SELECT COUNT(*) FROM bookings) AS total_bookings,
       (SELECT COALESCE(SUM(total_amount), 0) FROM bookings WHERE payment_status = 'paid') AS paid_revenue_total`,
  );
  const [clinicRevenueRows] = await pool.execute(
    `SELECT
       c.id AS clinic_id,
       c.clinic_name,
       c.approval_status,
       COUNT(b.id) AS paid_bookings_count,
       COALESCE(SUM(b.total_amount), 0) AS paid_revenue_total
     FROM clinics c
     LEFT JOIN bookings b
       ON b.clinic_id = c.id
      AND b.payment_status = 'paid'
     GROUP BY c.id, c.clinic_name, c.approval_status
     ORDER BY paid_revenue_total DESC, c.id DESC`,
  );
  return {
    total_users: Number(row?.total_users || 0),
    total_providers: Number(row?.total_providers || 0),
    pending_clinics: Number(row?.pending_clinics || 0),
    total_bookings: Number(row?.total_bookings || 0),
    paid_revenue_total: Number(row?.paid_revenue_total || 0),
    clinic_paid_revenue: (clinicRevenueRows || []).map((r) => ({
      clinic_id: Number(r.clinic_id),
      clinic_name: r.clinic_name || `Эмнэлэг #${r.clinic_id}`,
      approval_status: r.approval_status || null,
      paid_bookings_count: Number(r.paid_bookings_count || 0),
      paid_revenue_total: Number(r.paid_revenue_total || 0),
    })),
  };
}

module.exports = {
  getCustomerStats,
  getProviderStats,
  getAdminStats,
};

