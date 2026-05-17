const { AppError } = require("../utils/appError");
const { assertPositiveIntId, optionalTrimmedString } = require("../utils/validation");

const TARGET_TYPES = new Set([
  "chat_message",
  "review",
  "consultation_request",
  "doctor_profile",
  "clinic_profile",
  "other",
]);

function trimmed(v) {
  return typeof v === "string" ? v.trim() : "";
}

function validateContentReportCreateBody(body) {
  let target_type = trimmed(body.target_type) || "other";
  if (!TARGET_TYPES.has(target_type)) {
    throw new AppError(400, "Зорилтот төрөл буруу байна.");
  }
  let target_id = null;
  if (body.target_id !== undefined && body.target_id !== null && body.target_id !== "") {
    target_id = assertPositiveIntId(body.target_id, "target_id");
  }
  const reason_code = trimmed(body.reason_code);
  if (!reason_code || reason_code.length > 64) {
    throw new AppError(400, "Шалтгааны код (reason_code) 1–64 тэмдэгт байна.");
  }
  const details = optionalTrimmedString(body.details, 4000);
  return { target_type, target_id, reason_code, details };
}

module.exports = { validateContentReportCreateBody, TARGET_TYPES };
