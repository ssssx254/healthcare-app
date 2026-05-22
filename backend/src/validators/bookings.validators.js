const { AppError } = require("../utils/appError");
const { assertPositiveIntId, assertOptionalMeetingUrl } = require("../utils/validation");

const BOOKING_STATUS_UPDATE = new Set(["pending", "confirmed", "cancelled", "completed"]);

function validateBookingCreateBody(body) {
  const out = {
    clinic_id: assertPositiveIntId(body.clinic_id, "clinic_id"),
    doctor_id: assertPositiveIntId(body.doctor_id, "doctor_id"),
    service_id: assertPositiveIntId(body.service_id, "service_id"),
    slot_id: assertPositiveIntId(body.slot_id, "slot_id"),
  };
  if (body.lab_test_ids !== undefined && body.lab_test_ids !== null) {
    if (!Array.isArray(body.lab_test_ids)) {
      throw new AppError(400, "lab_test_ids массив байх ёстой.");
    }
    out.lab_test_ids = body.lab_test_ids.map((id, i) => assertPositiveIntId(id, `lab_test_ids[${i}]`));
  }
  return out;
}

function validateBookingStatusUpdateBody(body) {
  if (body.status === undefined && body.meeting_link === undefined) {
    throw new AppError(400, "status эсвэл meeting_link талбараас нэгийг илгээнэ үү.");
  }
  const out = {};
  if (body.status !== undefined) {
    const s = String(body.status).trim().toLowerCase();
    if (!BOOKING_STATUS_UPDATE.has(s)) {
      throw new AppError(400, "Захиалгын төлөв буруу байна.");
    }
    out.status = s;
  }
  if (body.meeting_link !== undefined) {
    out.meeting_link =
      body.meeting_link === null || body.meeting_link === "" ? null : assertOptionalMeetingUrl(body.meeting_link);
  }
  return out;
}

module.exports = { validateBookingCreateBody, validateBookingStatusUpdateBody };
