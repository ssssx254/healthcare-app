/** Мэдэгдлийн төрөл — filter болон ирээдүйн realtime payload-д ашиглана */
const NOTIFICATION_TYPES = Object.freeze({
  GENERAL: "general",
  BOOKING_CREATED: "booking_created",
  BOOKING_CONFIRMED: "booking_confirmed",
  BOOKING_CANCELLED: "booking_cancelled",
  CONSULTATION_CREATED: "consultation_created",
  CONSULTATION_ACCEPTED: "consultation_accepted",
});

const REFERENCE_TYPES = Object.freeze({
  BOOKING: "booking",
  CONSULTATION_REQUEST: "consultation_request",
});

module.exports = { NOTIFICATION_TYPES, REFERENCE_TYPES };
