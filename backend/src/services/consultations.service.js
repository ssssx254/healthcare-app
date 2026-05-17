const { pool } = require("../config/database");
const { sqlLimitOffset } = require("../utils/paginationSql");
const { AppError } = require("../utils/appError");
const { assertPositiveIntId, assertOptionalMeetingUrl, optionalTrimmedString } = require("../utils/validation");
const { CONSULTATION_REQUEST_STATUSES, isConsultationRequestStatus } = require("../constants/consultationRequests");
const { BOOKING_BUSINESS_RULES } = require("../constants/bookings");

async function assertConsultationClinicOwner(consultationId, ownerUserId, conn = pool) {
  const [rows] = await conn.execute(
    `SELECT cr.id FROM consultation_requests cr
     INNER JOIN clinics c ON c.id = cr.clinic_id
     WHERE cr.id = ? AND c.owner_user_id = ? LIMIT 1`,
    [consultationId, ownerUserId],
  );
  if (!rows[0]) {
    throw new AppError(403, "Зөвлөгөөний хүсэлтийг засах эрхгүй.");
  }
}

async function getConsultationRow(id, conn = pool) {
  const [rows] = await conn.execute(`SELECT * FROM consultation_requests WHERE id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

function assertFreeOnlineConsultationBody(body) {
  const wantsFree =
    body.is_free === undefined || body.is_free === null
      ? true
      : body.is_free === true || body.is_free === 1 || body.is_free === "1" || body.is_free === "true";
  if (!wantsFree) {
    throw new AppError(
      400,
      `Төлбөртэй цагийн захиалгыг ${BOOKING_BUSINESS_RULES.PAID_BOOKING_PATH} ашиглана уу.`,
    );
  }
  const requestType =
    typeof body.request_type === "string" && body.request_type.trim()
      ? body.request_type.trim().toLowerCase().slice(0, 64)
      : "online";
  if (requestType !== "online") {
    throw new AppError(400, "Үнэгүй зөвлөгөөний хүсэлт зөвхөн онлайн (request_type=online).");
  }
  return { requestType };
}

/**
 * Үнэгүй онлайн зөвлөгөө: төлбөргүй, consultation_requests мөр үүсгэнэ.
 * Төлбөртэй цаг — bookings урсгал.
 */
async function createConsultation(patientUserId, body) {
  const { requestType } = assertFreeOnlineConsultationBody(body);
  const { clinic_id, doctor_id } = body;
  const clinicId = assertPositiveIntId(clinic_id, "clinic_id");
  const patientMessage = optionalTrimmedString(body.patient_message, 2000);

  let doctorIdVal = null;
  if (doctor_id !== undefined && doctor_id !== null && doctor_id !== "") {
    doctorIdVal = assertPositiveIntId(doctor_id, "doctor_id");
    const [d] = await pool.execute(`SELECT id FROM doctors WHERE id = ? AND clinic_id = ? LIMIT 1`, [
      doctorIdVal,
      clinicId,
    ]);
    if (!d[0]) {
      throw new AppError(400, "Эмч энэ эмнэлэгт бүртгэлгүй байна.");
    }
  }

  const [result] = await pool.execute(
    `INSERT INTO consultation_requests (
      patient_user_id, clinic_id, doctor_id, request_type, is_free, status, meeting_link, patient_message
    ) VALUES (?, ?, ?, ?, 1, ?, NULL, ?)`,
    [patientUserId, clinicId, doctorIdVal, requestType, CONSULTATION_REQUEST_STATUSES.PENDING, patientMessage],
  );
  const created = await getConsultationByIdForUser(result.insertId, { id: patientUserId, role: "customer" });
  void require("./notificationTriggers.service").onConsultationCreated(created);
  return created;
}

async function getConsultationByIdForUser(consultationId, user) {
  const id = assertPositiveIntId(consultationId, "Хүсэлтийн дугаар");
  const row = await getConsultationRow(id);
  if (!row) {
    throw new AppError(404, "Хүсэлт олдсонгүй.");
  }
  if (user.role === "system_admin") {
    return row;
  }
  if (user.role === "customer" && row.patient_user_id !== user.id) {
    throw new AppError(403, "Хүсэлтийг харах эрхгүй.");
  }
  if (user.role === "provider") {
    await assertConsultationClinicOwner(id, user.id);
  }
  if (!["customer", "provider", "system_admin"].includes(user.role)) {
    throw new AppError(403, "Хүсэлтийг харах эрхгүй.");
  }
  return row;
}

function applyConsultationFilters(where, params, filters) {
  const { status, clinic_id, doctor_id, from_date, to_date } = filters;
  if (status) {
    if (!isConsultationRequestStatus(status)) {
      throw new AppError(400, "Төлөв буруу байна.");
    }
    where.push(`cr.status = ?`);
    params.push(status);
  }
  if (clinic_id) {
    where.push(`cr.clinic_id = ?`);
    params.push(assertPositiveIntId(clinic_id, "clinic_id"));
  }
  if (doctor_id) {
    where.push(`cr.doctor_id = ?`);
    params.push(assertPositiveIntId(doctor_id, "doctor_id"));
  }
  if (from_date) {
    where.push(`DATE(cr.created_at) >= ?`);
    params.push(String(from_date));
  }
  if (to_date) {
    where.push(`DATE(cr.created_at) <= ?`);
    params.push(String(to_date));
  }
}

async function listCustomerConsultations(patientUserId, listQuery) {
  const where = [`cr.patient_user_id = ?`];
  const params = [patientUserId];
  applyConsultationFilters(where, params, listQuery);
  const ws = where.join(" AND ");
  const [[countRow]] = await pool.execute(`SELECT COUNT(*) AS c FROM consultation_requests cr WHERE ${ws}`, params);
  const total = Number(countRow?.c || 0);
  const dir = listQuery.sortDir === "ASC" ? "ASC" : "DESC";
  const [rows] = await pool.execute(
    `SELECT cr.* FROM consultation_requests cr WHERE ${ws} ORDER BY cr.created_at ${dir}${sqlLimitOffset(listQuery)}`,
    params,
  );
  return { items: rows, total };
}

async function listProviderConsultations(providerUserId, listQuery) {
  const where = [`c.owner_user_id = ?`];
  const params = [providerUserId];
  applyConsultationFilters(where, params, listQuery);
  const ws = where.join(" AND ");
  const [[countRow]] = await pool.execute(
    `SELECT COUNT(*) AS c
     FROM consultation_requests cr
     INNER JOIN clinics c ON c.id = cr.clinic_id
     WHERE ${ws}`,
    params,
  );
  const total = Number(countRow?.c || 0);
  const dir = listQuery.sortDir === "ASC" ? "ASC" : "DESC";
  const [rows] = await pool.execute(
    `SELECT cr.*
     FROM consultation_requests cr
     INNER JOIN clinics c ON c.id = cr.clinic_id
     WHERE ${ws}
     ORDER BY cr.created_at ${dir}
     ${sqlLimitOffset(listQuery)}`,
    params,
  );
  return { items: rows, total };
}

async function listConsultations(user, listQuery) {
  if (user.role === "customer") return listCustomerConsultations(user.id, listQuery);
  if (user.role === "provider") return listProviderConsultations(user.id, listQuery);
  throw new AppError(403, "Хүсэлтүүдийг харах эрхгүй.");
}

function assertProviderConsultationStatusTransition(current, next) {
  if (!isConsultationRequestStatus(next)) {
    throw new AppError(400, "Төлөв буруу байна.");
  }
  if (current === CONSULTATION_REQUEST_STATUSES.CANCELLED || current === CONSULTATION_REQUEST_STATUSES.CLOSED) {
    throw new AppError(400, "Энэ хүсэлтийг дахин өөрчлөхгүй.");
  }
  if (next === CONSULTATION_REQUEST_STATUSES.PENDING) {
    throw new AppError(400, "pending төлөв рүү буцаах боломжгүй.");
  }
  if (next === CONSULTATION_REQUEST_STATUSES.ACCEPTED && current !== CONSULTATION_REQUEST_STATUSES.PENDING) {
    throw new AppError(400, "Зөвхөн pending хүсэлтийг accepted болгоно.");
  }
  if (next === CONSULTATION_REQUEST_STATUSES.CLOSED && current !== CONSULTATION_REQUEST_STATUSES.ACCEPTED) {
    throw new AppError(400, "Зөвхөн accepted хүсэлтийг closed болгоно.");
  }
  if (next === CONSULTATION_REQUEST_STATUSES.CANCELLED && current === CONSULTATION_REQUEST_STATUSES.ACCEPTED) {
    throw new AppError(400, "Accepted хүсэлтийг цуцлахын оронд closed ашиглана уу.");
  }
  if (next === CONSULTATION_REQUEST_STATUSES.CANCELLED && current !== CONSULTATION_REQUEST_STATUSES.PENDING) {
    throw new AppError(400, "Зөвхөн pending хүсэлтийг provider талаас cancelled болгоно.");
  }
}

/**
 * Provider: хүлээн авах, хаах, татгалзах, meeting link, хариу текст, чат нээх.
 */
async function updateConsultation(consultationId, user, body) {
  if (user.role !== "provider") {
    throw new AppError(403, "Зөвлөгөөний хүсэлтийг зөвхөн эмнэлэг шинэчилнэ.");
  }
  const cid = assertPositiveIntId(consultationId, "Хүсэлтийн дугаар");
  const { status, meeting_link, provider_message, open_chat } = body;
  if (
    status === undefined &&
    meeting_link === undefined &&
    provider_message === undefined &&
    open_chat === undefined
  ) {
    throw new AppError(400, "Шинэчлэх талбар оруулна уу (status, meeting_link, provider_message, open_chat).");
  }
  await assertConsultationClinicOwner(cid, user.id);
  const row = await getConsultationRow(cid);
  if (!row) throw new AppError(404, "Хүсэлт олдсонгүй.");

  const fields = [];
  const values = [];

  if (status !== undefined) {
    assertProviderConsultationStatusTransition(row.status, status);
    fields.push("status = ?");
    values.push(status);
  }
  if (meeting_link !== undefined) {
    if ([CONSULTATION_REQUEST_STATUSES.CLOSED, CONSULTATION_REQUEST_STATUSES.CANCELLED].includes(row.status)) {
      throw new AppError(400, "Энэ төлөвт уулзалтын холбоос өөрчлөхгүй.");
    }
    const url =
      meeting_link === null || meeting_link === "" ? null : assertOptionalMeetingUrl(meeting_link);
    fields.push("meeting_link = ?");
    values.push(url);
  }
  if (provider_message !== undefined) {
    if ([CONSULTATION_REQUEST_STATUSES.CLOSED, CONSULTATION_REQUEST_STATUSES.CANCELLED].includes(row.status)) {
      throw new AppError(400, "Энэ төлөвт хариу бичих боломжгүй.");
    }
    const msg = optionalTrimmedString(provider_message, 4000);
    fields.push("provider_message = ?");
    values.push(msg);
  }
  if (open_chat === true || open_chat === 1 || open_chat === "1" || open_chat === "true") {
    const effectiveStatus = status !== undefined ? status : row.status;
    if (effectiveStatus !== CONSULTATION_REQUEST_STATUSES.ACCEPTED) {
      throw new AppError(400, "Чатыг зөвхөн accepted хүсэлт дээр нээнэ.");
    }
    fields.push("chat_opened_at = CURRENT_TIMESTAMP");
  }

  if (fields.length === 0) {
    throw new AppError(400, "Шинэчлэх талбар байхгүй байна.");
  }
  values.push(cid);
  await pool.execute(`UPDATE consultation_requests SET ${fields.join(", ")} WHERE id = ?`, values);
  const fresh = await getConsultationRow(cid);
  if (status !== undefined && status === CONSULTATION_REQUEST_STATUSES.ACCEPTED) {
    void require("./notificationTriggers.service").onConsultationAccepted(fresh);
  }
  return getConsultationByIdForUser(cid, user);
}

async function cancelConsultation(consultationId, user) {
  const cid = assertPositiveIntId(consultationId, "Хүсэлтийн дугаар");
  const row = await getConsultationRow(cid);
  if (!row) throw new AppError(404, "Хүсэлт олдсонгүй.");

  if (user.role === "customer") {
    if (row.patient_user_id !== user.id) throw new AppError(403, "Цуцлах эрхгүй.");
    if (![CONSULTATION_REQUEST_STATUSES.PENDING, CONSULTATION_REQUEST_STATUSES.ACCEPTED].includes(row.status)) {
      throw new AppError(400, "Энэ төлөвөөс цуцлах боломжгүй.");
    }
    await pool.execute(`UPDATE consultation_requests SET status = ? WHERE id = ?`, [
      CONSULTATION_REQUEST_STATUSES.CANCELLED,
      cid,
    ]);
    return getConsultationByIdForUser(cid, user);
  }

  if (user.role === "provider") {
    await assertConsultationClinicOwner(cid, user.id);
    if (row.status !== CONSULTATION_REQUEST_STATUSES.PENDING) {
      throw new AppError(400, "Зөвхөн pending хүсэлтийг эмнэлгээс цуцална.");
    }
    await pool.execute(`UPDATE consultation_requests SET status = ? WHERE id = ?`, [
      CONSULTATION_REQUEST_STATUSES.CANCELLED,
      cid,
    ]);
    return getConsultationByIdForUser(cid, user);
  }

  throw new AppError(403, "Цуцлах эрхгүй.");
}

module.exports = {
  createConsultation,
  getConsultationByIdForUser,
  listConsultations,
  listCustomerConsultations,
  listProviderConsultations,
  updateConsultation,
  cancelConsultation,
};
