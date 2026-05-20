const { AppError } = require("../utils/appError");
const { assertPositiveIntId } = require("../utils/validation");
const { parsePagination } = require("../utils/listQuery");

function validateDoctorReviewsListQuery(query) {
  return parsePagination(query, { defaultPageSize: 20, maxPageSize: 100 });
}

function validateFeaturedDoctorsQuery(query) {
  const minRaw = query.minRating ?? query.min_rating ?? "4.5";
  const minRating = Number(minRaw);
  if (!Number.isFinite(minRating) || minRating < 1 || minRating > 5) {
    throw new AppError(400, "minRating 1–5 хооронд байна.");
  }
  const limitRaw = query.limit ?? query.page_size ?? "6";
  const limit = Math.min(50, Math.max(1, Math.floor(Number(limitRaw)) || 6));
  return { minRating, limit };
}

function validateCreateDoctorReviewBody(body) {
  const booking_id = assertPositiveIntId(body.booking_id, "booking_id");
  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new AppError(400, "Үнэлгээ 1–5 одны хооронд байна.");
  }
  const comment =
    body.comment === undefined || body.comment === null ? null : String(body.comment).trim().slice(0, 2000);
  return { booking_id, rating, comment: comment || null };
}

module.exports = {
  validateDoctorReviewsListQuery,
  validateFeaturedDoctorsQuery,
  validateCreateDoctorReviewBody,
};
