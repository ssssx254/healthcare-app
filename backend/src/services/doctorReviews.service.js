const { pool } = require("../config/database");
const { AppError } = require("../utils/appError");
const { sqlLimitOffset } = require("../utils/paginationSql");
const { assertPositiveIntId, optionalTrimmedString } = require("../utils/validation");
const { ROLES } = require("../constants/roles");
const { getDoctorById } = require("./doctors.service");

function assertRating(v) {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1 || n > 5) {
    throw new AppError(400, "Үнэлгээ 1–5 одны хооронд байна.");
  }
  return n;
}

async function getDoctorRatingStats(doctorId) {
  const [[row]] = await pool.execute(
    `SELECT ROUND(AVG(rating), 2) AS average_rating, COUNT(*) AS review_count
     FROM doctor_reviews WHERE doctor_id = ?`,
    [doctorId],
  );
  return {
    average_rating: row?.average_rating != null ? Number(row.average_rating) : null,
    review_count: Number(row?.review_count || 0),
  };
}

async function listDoctorReviews(doctorId, listQuery) {
  await getDoctorById(doctorId);
  const summary = await getDoctorRatingStats(doctorId);
  const [[countRow]] = await pool.execute(
    `SELECT COUNT(*) AS c FROM doctor_reviews WHERE doctor_id = ?`,
    [doctorId],
  );
  const total = Number(countRow?.c || 0);
  const [rows] = await pool.execute(
    `SELECT dr.id, dr.doctor_id, dr.rating, dr.comment, dr.created_at,
            u.full_name AS customer_name
     FROM doctor_reviews dr
     INNER JOIN users u ON u.id = dr.customer_user_id
     WHERE dr.doctor_id = ?
     ORDER BY dr.created_at DESC
     ${sqlLimitOffset(listQuery, { max: 100 })}`,
    [doctorId],
  );
  const items = rows.map((r) => ({
    id: r.id,
    doctor_id: r.doctor_id,
    rating: r.rating,
    comment: r.comment,
    created_at: r.created_at,
    customer_name: maskCustomerName(r.customer_name),
  }));
  return { summary, items, total };
}

function maskCustomerName(fullName) {
  const t = String(fullName || "").trim();
  if (!t) return "Үйлчлүүлэгч";
  const parts = t.split(/\s+/);
  if (parts.length === 1) return `${parts[0].charAt(0)}***`;
  return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
}

async function findEligibleBookingForReview(doctorId, customerUserId) {
  const [rows] = await pool.execute(
    `SELECT b.id
     FROM bookings b
     LEFT JOIN doctor_reviews dr ON dr.booking_id = b.id
     WHERE b.patient_user_id = ?
       AND b.doctor_id = ?
       AND b.status = 'completed'
       AND dr.id IS NULL
     ORDER BY b.created_at DESC
     LIMIT 1`,
    [customerUserId, doctorId],
  );
  return rows[0]?.id ?? null;
}

async function hasReviewedDoctorAsCustomer(doctorId, customerUserId) {
  const [[row]] = await pool.execute(
    `SELECT COUNT(*) AS c FROM doctor_reviews WHERE doctor_id = ? AND customer_user_id = ?`,
    [doctorId, customerUserId],
  );
  return Number(row?.c || 0) > 0;
}

async function getViewerReviewState(doctorId, viewerUser) {
  if (!viewerUser) {
    return {
      can_submit: false,
      booking_id: null,
      message: "Зөвхөн үзлэгт хамрагдсан хэрэглэгч үнэлгээ өгөх боломжтой.",
    };
  }
  if (viewerUser.role !== ROLES.CUSTOMER) {
    return {
      can_submit: false,
      booking_id: null,
      message: "Зөвхөн үзлэгт хамрагдсан хэрэглэгч үнэлгээ өгөх боломжтой.",
    };
  }
  const eligibleBookingId = await findEligibleBookingForReview(doctorId, viewerUser.id);
  if (eligibleBookingId) {
    return {
      can_submit: true,
      booking_id: eligibleBookingId,
      message: null,
    };
  }
  const reviewedAny = await hasReviewedDoctorAsCustomer(doctorId, viewerUser.id);
  if (reviewedAny) {
    return {
      can_submit: false,
      booking_id: null,
      message: "Та энэ үзлэгт үнэлгээ өгсөн байна.",
    };
  }
  return {
    can_submit: false,
    booking_id: null,
    message: "Зөвхөн үзлэгт хамрагдсан хэрэглэгч үнэлгээ өгөх боломжтой.",
  };
}

async function createDoctorReview(doctorId, customerUserId, body) {
  await getDoctorById(doctorId);
  const bookingId = assertPositiveIntId(body.booking_id, "booking_id");
  const rating = assertRating(body.rating);
  const comment = optionalTrimmedString(body.comment, 2000);

  const [bookingRows] = await pool.execute(
    `SELECT id, patient_user_id, doctor_id, status FROM bookings WHERE id = ? LIMIT 1`,
    [bookingId],
  );
  const booking = bookingRows[0];
  if (!booking) {
    throw new AppError(404, "Захиалга олдсонгүй.");
  }
  if (Number(booking.patient_user_id) !== Number(customerUserId)) {
    throw new AppError(403, "Энэ захиалгад үнэлгээ өгөх эрхгүй.");
  }
  if (Number(booking.doctor_id) !== Number(doctorId)) {
    throw new AppError(400, "Захиалга энэ эмчид хамаарахгүй байна.");
  }
  if (booking.status !== "completed") {
    throw new AppError(400, "Зөвхөн дууссан үзлэгт үнэлгээ өгнө.");
  }

  const [dup] = await pool.execute(`SELECT id FROM doctor_reviews WHERE booking_id = ? LIMIT 1`, [bookingId]);
  if (dup[0]) {
    throw new AppError(409, "Та энэ үзлэгт үнэлгээ өгсөн байна.");
  }

  const [result] = await pool.execute(
    `INSERT INTO doctor_reviews (doctor_id, customer_user_id, booking_id, rating, comment)
     VALUES (?, ?, ?, ?, ?)`,
    [doctorId, customerUserId, bookingId, rating, comment],
  );

  const [created] = await pool.execute(
    `SELECT id, doctor_id, rating, comment, created_at FROM doctor_reviews WHERE id = ?`,
    [result.insertId],
  );
  const summary = await getDoctorRatingStats(doctorId);
  return { review: created[0], summary };
}

module.exports = {
  getDoctorRatingStats,
  listDoctorReviews,
  getViewerReviewState,
  createDoctorReview,
};
