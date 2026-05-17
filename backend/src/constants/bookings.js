/**
 * Төлбөртэй цагийн захиалга — consultation_requests-ээс тусдаа.
 */
const BOOKING_BUSINESS_RULES = Object.freeze({
  /** Үнэгүй зөвлөгөөний хүсэлтийн API */
  FREE_CONSULTATION_PATH: "/api/consultations",
  /** Төлбөртэй цагийн захиалгын API */
  PAID_BOOKING_PATH: "/api/bookings",
});

module.exports = { BOOKING_BUSINESS_RULES };
