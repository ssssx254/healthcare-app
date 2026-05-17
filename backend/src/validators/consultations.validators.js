const { AppError } = require("../utils/appError");
const { assertPositiveIntId, optionalTrimmedString } = require("../utils/validation");
const { isConsultationRequestStatus } = require("../constants/consultationRequests");

function validateConsultationCreateBody(body) {
  const clinic_id = assertPositiveIntId(body.clinic_id, "clinic_id");
  let doctor_id;
  if (body.doctor_id !== undefined && body.doctor_id !== null && body.doctor_id !== "") {
    doctor_id = assertPositiveIntId(body.doctor_id, "doctor_id");
  }
  const patient_message = optionalTrimmedString(body.patient_message, 2000);
  let request_type =
    typeof body.request_type === "string" && body.request_type.trim()
      ? body.request_type.trim().toLowerCase().slice(0, 64)
      : "online";
  if (request_type !== "online") {
    throw new AppError(400, "Үнэгүй зөвлөгөөний хүсэлт зөвхөн онлайн (request_type=online).");
  }
  const is_free =
    body.is_free === undefined || body.is_free === null
      ? true
      : body.is_free === true || body.is_free === 1 || body.is_free === "1" || body.is_free === "true";
  if (!is_free) {
    throw new AppError(400, "Төлбөртэй цагийн захиалгыг захиалгын endpoint ашиглана уу.");
  }
  return { clinic_id, doctor_id, patient_message, request_type, is_free: true };
}

function validateConsultationUpdateBody(body) {
  const out = {};
  if (body.status !== undefined) {
    const s = String(body.status).trim().toLowerCase();
    if (!isConsultationRequestStatus(s)) {
      throw new AppError(400, "Төлөв буруу байна.");
    }
    out.status = s;
  }
  if (body.meeting_link !== undefined) out.meeting_link = body.meeting_link;
  if (body.provider_message !== undefined) out.provider_message = body.provider_message;
  if (body.open_chat !== undefined) out.open_chat = body.open_chat;
  if (Object.keys(out).length === 0) {
    throw new AppError(400, "Шинэчлэх талбар оруулна уу (status, meeting_link, provider_message, open_chat).");
  }
  return out;
}

module.exports = { validateConsultationCreateBody, validateConsultationUpdateBody };
