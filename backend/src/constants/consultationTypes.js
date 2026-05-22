const CONSULTATION_TYPES = Object.freeze({
  PAID_VISIT: "paid_visit",
  FREE_CONSULTATION: "free_consultation",
});

const ALL_CONSULTATION_TYPES = Object.freeze(Object.values(CONSULTATION_TYPES));

function isConsultationType(v) {
  return typeof v === "string" && ALL_CONSULTATION_TYPES.includes(v);
}

module.exports = { CONSULTATION_TYPES, ALL_CONSULTATION_TYPES, isConsultationType };
