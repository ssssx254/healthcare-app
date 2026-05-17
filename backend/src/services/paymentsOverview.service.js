const { pool } = require("../config/database");
const { AppError } = require("../utils/appError");
const { ROLES } = require("../constants/roles");
const { assertPositiveIntId } = require("../utils/validation");

async function providerRevenueSummary(user, query = {}) {
  assertProvider(user);
  const providerUserId = user.id;
  const where = [
    `c.owner_user_id = ?`,
    `b.payment_status = 'paid'`,
    `b.status IN ('confirmed','completed')`,
  ];
  const params = [providerUserId];
  if (query.clinic_id) {
    where.push(`b.clinic_id = ?`);
    params.push(assertPositiveIntId(query.clinic_id, "clinic_id"));
  }
  if (query.from_date) {
    where.push(`DATE(b.created_at) >= ?`);
    params.push(String(query.from_date));
  }
  if (query.to_date) {
    where.push(`DATE(b.created_at) <= ?`);
    params.push(String(query.to_date));
  }
  const [sumRow] = await pool.execute(
    `SELECT COALESCE(SUM(b.total_amount), 0) AS gross_revenue, COUNT(*) AS paid_bookings
     FROM bookings b
     INNER JOIN clinics c ON c.id = b.clinic_id
     WHERE ${where.join(" AND ")}`,
    params,
  );
  const [byClinic] = await pool.execute(
    `SELECT b.clinic_id, c.clinic_name, COALESCE(SUM(b.total_amount), 0) AS revenue, COUNT(*) AS bookings
     FROM bookings b
     INNER JOIN clinics c ON c.id = b.clinic_id
     WHERE ${where.join(" AND ")}
     GROUP BY b.clinic_id, c.clinic_name`,
    params,
  );
  return {
    gross_revenue: Number(sumRow[0]?.gross_revenue || 0),
    paid_bookings: Number(sumRow[0]?.paid_bookings || 0),
    by_clinic: byClinic,
  };
}

async function adminPaymentOverview(user) {
  assertAdmin(user);
  const [[bookingAgg]] = await pool.execute(
    `SELECT
       COUNT(*) AS total_bookings,
       SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) AS paid_bookings,
       COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0) AS paid_revenue_total
     FROM bookings`,
  );
  const [[walletAgg]] = await pool.execute(
    `SELECT
       COALESCE(SUM(balance), 0) AS customer_wallets_balance_sum,
       COUNT(*) AS wallets_count
     FROM wallets`,
  );
  const [[topupAgg]] = await pool.execute(
    `SELECT COALESCE(SUM(amount), 0) AS total_topups
     FROM wallet_transactions
     WHERE transaction_type = 'top_up' AND direction = 'credit'`,
  );
  const [[refundAgg]] = await pool.execute(
    `SELECT COALESCE(SUM(amount), 0) AS total_refunds
     FROM wallet_transactions
     WHERE transaction_type = 'booking_refund' AND direction = 'credit'`,
  );
  const [[paymentAgg]] = await pool.execute(
    `SELECT COALESCE(SUM(amount), 0) AS total_booking_payments
     FROM wallet_transactions
     WHERE transaction_type = 'booking_payment' AND direction = 'debit'`,
  );
  return {
    bookings: {
      total: Number(bookingAgg?.total_bookings || 0),
      paid_count: Number(bookingAgg?.paid_bookings || 0),
      paid_revenue_total: Number(bookingAgg?.paid_revenue_total || 0),
    },
    wallets: {
      count: Number(walletAgg?.wallets_count || 0),
      balance_sum: Number(walletAgg?.customer_wallets_balance_sum || 0),
    },
    wallet_transactions: {
      total_topups: Number(topupAgg?.total_topups || 0),
      total_refunds_credited: Number(refundAgg?.total_refunds || 0),
      total_booking_payments_debited: Number(paymentAgg?.total_booking_payments || 0),
    },
  };
}

function assertProvider(user) {
  if (!user || user.role !== ROLES.PROVIDER) {
    throw new AppError(403, "Зөвхөн үйлчилгээ үзүүлэгч энэ тайлангийн эрхтэй.");
  }
}

function assertAdmin(user) {
  if (!user || user.role !== ROLES.SYSTEM_ADMIN) {
    throw new AppError(403, "Зөвхөн системийн админ энэ тайлангийн эрхтэй.");
  }
}

module.exports = {
  providerRevenueSummary,
  adminPaymentOverview,
  assertProvider,
  assertAdmin,
};
