const { pool } = require("../config/database");
const { sqlLimitOffset } = require("../utils/paginationSql");
const { AppError } = require("../utils/appError");
const { assertPositiveIntId, assertOptionalMeetingUrl, optionalTrimmedString } = require("../utils/validation");
const { CONSULTATION_REQUEST_STATUSES, isConsultationRequestStatus } = require("../constants/consultationRequests");
const { CONSULTATION_TYPES } = require("../constants/consultationTypes");
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
  const [rows] = await conn.execute(
    `SELECT cr.*,
            s.slot_date, s.start_time AS slot_start_time, s.end_time AS slot_end_time,
            d.full_name AS doctor_name, d.specialty AS doctor_specialty,
            c.clinic_name
     FROM consultation_requests cr
     LEFT JOIN schedule_slots s ON s.id = cr.slot_id
     LEFT JOIN doctors d ON d.id = cr.doctor_id
     LEFT JOIN clinics c ON c.id = cr.clinic_id
     WHERE cr.id = ? LIMIT 1`,
    [id],
  );
  return rows[0] || null;
}

async function releaseConsultationSlot(conn, slotId) {
  if (!slotId) return;
  await conn.execute(
    `UPDATE schedule_slots SET is_available = 1, slot_status = 'available' WHERE id = ? AND slot_status = 'booked'`,
    [slotId],
  );
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

function formatTimeHm(t) {
  const raw = String(t || "").trim();
  const m = raw.match(/^(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : raw.slice(0, 5);
}

/**
 * Үнэгүй зөвлөгөөний боломжит эмч + цагууд.
 */
async function listFreeConsultationAvailability(listQuery = {}) {
  const from =
    listQuery.from_date && String(listQuery.from_date).trim()
      ? String(listQuery.from_date).trim()
      : new Date().toISOString().slice(0, 10);
  const params = [from];
  let dateToSql = "";
  if (listQuery.to_date && String(listQuery.to_date).trim()) {
    dateToSql = " AND s.slot_date <= ?";
    params.push(String(listQuery.to_date).trim());
  }
  const [rows] = await pool.execute(
    `SELECT s.id AS slot_id, s.slot_date, s.start_time, s.end_time,
            d.id AS doctor_id, d.full_name AS doctor_name, d.specialty,
            c.id AS clinic_id, c.clinic_name
     FROM schedule_slots s
     INNER JOIN doctors d ON d.id = s.doctor_id
     INNER JOIN clinics c ON c.id = d.clinic_id
     WHERE s.consultation_type = ?
       AND s.is_available = 1 AND s.slot_status = 'available'
       AND s.slot_date >= ?${dateToSql}
     ORDER BY s.slot_date ASC, s.start_time ASC, d.full_name ASC
     LIMIT 500`,
    [CONSULTATION_TYPES.FREE_CONSULTATION, ...params],
  );
  const byDoctor = new Map();
  for (const r of rows) {
    if (!byDoctor.has(r.doctor_id)) {
      byDoctor.set(r.doctor_id, {
        doctor_id: r.doctor_id,
        doctor_name: r.doctor_name,
        specialty: r.doctor_specialty ?? null,
        clinic_id: r.clinic_id,
        clinic_name: r.clinic_name,
        slots: [],
      });
    }
    byDoctor.get(r.doctor_id).slots.push({
      id: r.slot_id,
      slot_date: r.slot_date,
      start_time: formatTimeHm(r.start_time),
      end_time: formatTimeHm(r.end_time),
      label: `${r.slot_date} ${formatTimeHm(r.start_time)} – ${formatTimeHm(r.end_time)}`,
    });
  }
  return { items: [...byDoctor.values()] };
}

/**
 * Үнэгүй онлайн зөвлөгөө: төлбөргүй, consultation_requests мөр үүсгэнэ.
 */
async function createConsultation(patientUserId, body) {
  const { requestType } = assertFreeOnlineConsultationBody(body);
  const clinicId = assertPositiveIntId(body.clinic_id, "clinic_id");
  const symptoms = optionalTrimmedString(body.symptoms, 4000);
  const question = optionalTrimmedString(body.question, 4000);
  const notes = optionalTrimmedString(body.notes, 4000);
  const patientMessage =
    optionalTrimmedString(body.patient_message, 2000) ||
    [symptoms, question, notes].filter(Boolean).join("\n\n").trim() ||
    null;

  let doctorIdVal = null;
  if (body.doctor_id !== undefined && body.doctor_id !== null && body.doctor_id !== "") {
    doctorIdVal = assertPositiveIntId(body.doctor_id, "doctor_id");
  }

  let slotIdVal = null;
  if (body.slot_id !== undefined && body.slot_id !== null && body.slot_id !== "") {
    slotIdVal = assertPositiveIntId(body.slot_id, "slot_id");
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    if (slotIdVal) {
      const [slotRows] = await conn.execute(
        `SELECT s.*, d.clinic_id AS doctor_clinic_id
         FROM schedule_slots s
         INNER JOIN doctors d ON d.id = s.doctor_id
         WHERE s.id = ? FOR UPDATE`,
        [slotIdVal],
      );
      const slot = slotRows[0];
      if (!slot) throw new AppError(404, "Сонгосон цаг олдсонгүй.");
      if (slot.consultation_type !== CONSULTATION_TYPES.FREE_CONSULTATION) {
        throw new AppError(400, "Энэ цаг үнэгүй зөвлөгөөнд зориулагдаагүй.");
      }
      if (Number(slot.is_available) !== 1 || slot.slot_status !== "available") {
        throw new AppError(409, "Сонгосон цаг аль хэдийн захиалагдсан байна.");
      }
      if (Number(slot.doctor_clinic_id) !== clinicId) {
        throw new AppError(400, "Эмч энэ эмнэлэгт харьяалагдахгүй байна.");
      }
      doctorIdVal = Number(slot.doctor_id);
      await conn.execute(`UPDATE schedule_slots SET is_available = 0, slot_status = 'booked' WHERE id = ?`, [
        slotIdVal,
      ]);
    } else if (doctorIdVal) {
      const [d] = await conn.execute(`SELECT id FROM doctors WHERE id = ? AND clinic_id = ? LIMIT 1`, [
        doctorIdVal,
        clinicId,
      ]);
      if (!d[0]) throw new AppError(400, "Эмч энэ эмнэлэгт бүртгэлгүй байна.");
    }

    const [result] = await conn.execute(
      `INSERT INTO consultation_requests (
        patient_user_id, clinic_id, doctor_id, slot_id, request_type, consultation_type,
        is_free, status, meeting_link, patient_message, symptoms, question, notes
      ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, NULL, ?, ?, ?, ?)`,
      [
        patientUserId,
        clinicId,
        doctorIdVal,
        slotIdVal,
        requestType,
        CONSULTATION_TYPES.FREE_CONSULTATION,
        CONSULTATION_REQUEST_STATUSES.PENDING,
        patientMessage,
        symptoms,
        question,
        notes,
      ],
    );
    await conn.commit();
    const created = await getConsultationByIdForUser(result.insertId, { id: patientUserId, role: "customer" });
    void require("./notificationTriggers.service").onConsultationCreated(created);
    return created;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
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
    `SELECT cr.*, s.slot_date, s.start_time AS slot_start_time, s.end_time AS slot_end_time,
            d.full_name AS doctor_name, c.clinic_name
     FROM consultation_requests cr
     LEFT JOIN schedule_slots s ON s.id = cr.slot_id
     LEFT JOIN doctors d ON d.id = cr.doctor_id
     LEFT JOIN clinics c ON c.id = cr.clinic_id
     WHERE ${ws} ORDER BY cr.created_at ${dir}${sqlLimitOffset(listQuery)}`,
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
    `SELECT cr.*, s.slot_date, s.start_time AS slot_start_time, s.end_time AS slot_end_time,
            d.full_name AS doctor_name, c.clinic_name
     FROM consultation_requests cr
     INNER JOIN clinics c ON c.id = cr.clinic_id
     LEFT JOIN schedule_slots s ON s.id = cr.slot_id
     LEFT JOIN doctors d ON d.id = cr.doctor_id
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
 * Provider: хүлээн авах, татгалзах, дуусгах, meeting link, эмчийн тэмдэглэл.
 */
async function updateConsultation(consultationId, user, body) {
  if (user.role !== "provider") {
    throw new AppError(403, "Зөвлөгөөний хүсэлтийг зөвхөн эмнэлэг шинэчилнэ.");
  }
  const cid = assertPositiveIntId(consultationId, "Хүсэлтийн дугаар");
  const { status, meeting_link, provider_message, provider_notes, open_chat } = body;
  if (
    status === undefined &&
    meeting_link === undefined &&
    provider_message === undefined &&
    provider_notes === undefined &&
    open_chat === undefined
  ) {
    throw new AppError(400, "Шинэчлэх талбар оруулна уу.");
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
    const url = meeting_link === null || meeting_link === "" ? null : assertOptionalMeetingUrl(meeting_link);
    fields.push("meeting_link = ?");
    values.push(url);
  }
  if (provider_message !== undefined) {
    if ([CONSULTATION_REQUEST_STATUSES.CLOSED, CONSULTATION_REQUEST_STATUSES.CANCELLED].includes(row.status)) {
      throw new AppError(400, "Энэ төлөвт хариу бичих боломжгүй.");
    }
    fields.push("provider_message = ?");
    values.push(optionalTrimmedString(provider_message, 4000));
  }
  if (provider_notes !== undefined) {
    if ([CONSULTATION_REQUEST_STATUSES.CLOSED, CONSULTATION_REQUEST_STATUSES.CANCELLED].includes(row.status)) {
      throw new AppError(400, "Энэ төлөвт тэмдэглэл бичих боломжгүй.");
    }
    fields.push("provider_notes = ?");
    values.push(optionalTrimmedString(provider_notes, 4000));
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
  if (status === CONSULTATION_REQUEST_STATUSES.CANCELLED) {
    await releaseConsultationSlot(pool, fresh.slot_id);
  }
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
    await releaseConsultationSlot(pool, row.slot_id);
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
    await releaseConsultationSlot(pool, row.slot_id);
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
  listFreeConsultationAvailability,
  updateConsultation,
  cancelConsultation,
};
