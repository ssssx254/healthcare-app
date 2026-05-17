const { pool } = require("../config/database");
const { AppError } = require("../utils/appError");
const { assertPositiveIntId } = require("../utils/validation");

const MAX_ANSWERS_JSON_BYTES = 65536;

function normalizeAnswers(answers) {
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
    throw new AppError(400, "answers объект байх ёстой.");
  }
  const keys = Object.keys(answers);
  if (keys.length === 0) {
    throw new AppError(400, "Асуултын хариу хоосон байж болохгүй.");
  }
  if (keys.length > 100) {
    throw new AppError(400, "Хэт олон талбар.");
  }
  const out = {};
  for (const k of keys) {
    if (typeof k !== "string" || k.trim().length === 0 || k.length > 120) {
      throw new AppError(400, "Асуултын түлхүүр буруу байна.");
    }
    const key = k.trim();
    const v = answers[k];
    if (typeof v === "string") {
      const t = v.trim();
      if (t.length > 4000) {
        throw new AppError(400, "Хариуны урт хэтэрсэн.");
      }
      out[key] = t;
    } else if (typeof v === "number") {
      if (!Number.isFinite(v)) {
        throw new AppError(400, "Тоон утга буруу байна.");
      }
      out[key] = v;
    } else if (typeof v === "boolean") {
      out[key] = v;
    } else {
      throw new AppError(400, "Хариу зөвхөн текст, тоо эсвэл boolean байна.");
    }
  }
  const json = JSON.stringify(out);
  if (Buffer.byteLength(json, "utf8") > MAX_ANSWERS_JSON_BYTES) {
    throw new AppError(400, "Анкетын хэмжээ хэт том байна.");
  }
  return json;
}

async function createQuestionnaire(patientUserId, body) {
  const { booking_id, consultation_request_id, answers } = body;
  const hasBooking = booking_id !== undefined && booking_id !== null && booking_id !== "";
  const hasConsult = consultation_request_id !== undefined && consultation_request_id !== null && consultation_request_id !== "";

  if (hasBooking && hasConsult) {
    throw new AppError(400, "Зөвхөн booking_id эсвэл consultation_request_id-ийн нэгийг илгээнэ үү.");
  }
  if (!hasBooking && !hasConsult) {
    throw new AppError(400, "booking_id эсвэл consultation_request_id-ийн аль нэгийг заавал.");
  }

  const answersJson = normalizeAnswers(answers);

  let bookingIdVal = null;
  let consultIdVal = null;

  if (hasBooking) {
    const bid = assertPositiveIntId(booking_id, "booking_id");
    bookingIdVal = bid;
    const [brows] = await pool.execute(`SELECT * FROM bookings WHERE id = ? AND patient_user_id = ? LIMIT 1`, [
      bid,
      patientUserId,
    ]);
    const booking = brows[0];
    if (!booking) {
      throw new AppError(403, "Захиалгын анкет бөглөх эрхгүй.");
    }
    if (booking.booking_type === "formal") {
      /* `bookings` үүсгэхэд `status` нь `pending` (төлбөр хүлээгдэж буй) — UI-ийн `pending_request`-тай нийцүүлсэн. */
      if (booking.status !== "pending") {
        throw new AppError(400, "Албан захиалгын анкетыг зөвхөн хүлээгдэж буй үед бөглөнө.");
      }
    } else if (booking.booking_type === "free_online") {
      if (!["confirmed", "pending"].includes(booking.status)) {
        throw new AppError(400, "Энэ захиалгын төлөвт анкет бөглөх боломжгүй.");
      }
    }
    const [ex] = await pool.execute(`SELECT id FROM questionnaires WHERE booking_id = ? LIMIT 1`, [bid]);
    if (ex[0]) {
      throw new AppError(409, "Энэ захиалгын анкет аль хэдийн илгээсэн байна.");
    }
  }

  if (hasConsult) {
    const cid = assertPositiveIntId(consultation_request_id, "consultation_request_id");
    consultIdVal = cid;
    const [crows] = await pool.execute(
      `SELECT * FROM consultation_requests WHERE id = ? AND patient_user_id = ? LIMIT 1`,
      [cid, patientUserId],
    );
    const cr = crows[0];
    if (!cr) {
      throw new AppError(403, "Зөвлөгөөний анкет бөглөх эрхгүй.");
    }
    if (!["pending", "accepted"].includes(cr.status)) {
      throw new AppError(400, "Энэ хүсэлтийн төлөвт анкет бөглөх боломжгүй.");
    }
    const [ex2] = await pool.execute(`SELECT id FROM questionnaires WHERE consultation_request_id = ? LIMIT 1`, [
      cid,
    ]);
    if (ex2[0]) {
      throw new AppError(409, "Энэ хүсэлтийн анкет аль хэдийн илгээсэн байна.");
    }
  }

  const [insertResult] = await pool.execute(
    `INSERT INTO questionnaires (patient_user_id, booking_id, consultation_request_id, answers_json)
     VALUES (?, ?, ?, ?)`,
    [patientUserId, bookingIdVal, consultIdVal, answersJson],
  );
  const [rows] = await pool.execute(`SELECT * FROM questionnaires WHERE id = ? LIMIT 1`, [insertResult.insertId]);
  return rows[0];
}

async function getQuestionnaireById(id, user) {
  const qid = assertPositiveIntId(id, "Анкетын дугаар");
  const [rows] = await pool.execute(`SELECT * FROM questionnaires WHERE id = ? LIMIT 1`, [qid]);
  const row = rows[0];
  if (!row) {
    throw new AppError(404, "Анкет олдсонгүй.");
  }
  if (row.patient_user_id === user.id) {
    return row;
  }
  if (user.role === "provider") {
    const [access] = await pool.execute(
      `SELECT q.id FROM questionnaires q
       LEFT JOIN bookings b ON b.id = q.booking_id
       LEFT JOIN clinics c1 ON c1.id = b.clinic_id
       LEFT JOIN consultation_requests cr ON cr.id = q.consultation_request_id
       LEFT JOIN clinics c2 ON c2.id = cr.clinic_id
       WHERE q.id = ? AND (c1.owner_user_id = ? OR c2.owner_user_id = ?)
       LIMIT 1`,
      [qid, user.id, user.id],
    );
    if (access[0]) {
      return row;
    }
  }
  throw new AppError(403, "Анкет харах эрхгүй.");
}

module.exports = { createQuestionnaire, getQuestionnaireById };
