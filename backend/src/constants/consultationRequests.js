/**
 * Үнэгүй онлайн зөвлөгөөний хүсэлтүүд — төлбөртэй цагийн захиалгаас тусдаа урсгал.
 */
const CONSULTATION_REQUEST_STATUSES = Object.freeze({
  PENDING: "pending",
  ACCEPTED: "accepted",
  CLOSED: "closed",
  CANCELLED: "cancelled",
});

const ALL_CONSULTATION_REQUEST_STATUSES = Object.freeze(Object.values(CONSULTATION_REQUEST_STATUSES));

function isConsultationRequestStatus(value) {
  return typeof value === "string" && ALL_CONSULTATION_REQUEST_STATUSES.includes(value);
}

module.exports = {
  CONSULTATION_REQUEST_STATUSES,
  ALL_CONSULTATION_REQUEST_STATUSES,
  isConsultationRequestStatus,
};
