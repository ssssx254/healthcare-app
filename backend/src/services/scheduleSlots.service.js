const { pool } = require("../config/database");
const { AppError } = require("../utils/appError");
const { sqlLimitOffset } = require("../utils/paginationSql");
const { CONSULTATION_TYPES, isConsultationType } = require("../constants/consultationTypes");

function asBool(v, defaultValue = true) {
  if (v === undefined) return defaultValue;
  return Boolean(v);
}

function parseTimeToMinutes(value) {
  const raw = String(value || "").trim();
  const m = raw.match(/^(\d{2}):(\d{2})(?::\d{2})?$/);
  if (!m) throw new AppError(400, "Цагийн формат HH:mm байна.");
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (hh > 23 || mm > 59) throw new AppError(400, "Цагийн формат буруу байна.");
  return hh * 60 + mm;
}

function minutesToTime(total) {
  const hh = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const mm = (total % 60).toString().padStart(2, "0");
  return `${hh}:${mm}:00`;
}

async function assertSlotOwnedByProvider(slotId, ownerUserId) {
  const [rows] = await pool.execute(
    `SELECT s.id FROM schedule_slots s
     INNER JOIN doctors d ON d.id = s.doctor_id
     INNER JOIN clinics c ON c.id = d.clinic_id
     WHERE s.id = ? AND c.owner_user_id = ? LIMIT 1`,
    [slotId, ownerUserId],
  );
  if (!rows[0]) {
    throw new AppError(403, "Цагийн мэдээлэл засах эрхгүй.");
  }
}

async function assertDoctorOwnedByProvider(doctorId, ownerUserId) {
  const [rows] = await pool.execute(
    `SELECT d.id FROM doctors d
     INNER JOIN clinics c ON c.id = d.clinic_id
     WHERE d.id = ? AND c.owner_user_id = ? LIMIT 1`,
    [doctorId, ownerUserId],
  );
  if (!rows[0]) {
    throw new AppError(403, "Энэ эмчийн цаг нэмэх эрхгүй.");
  }
}

async function assertNoOverlappingSlot({
  doctorId,
  slotDate,
  startTime,
  endTime,
  consultationType = null,
  ignoreSlotId = null,
}) {
  const sql = `SELECT id FROM schedule_slots
    WHERE doctor_id = ?
      AND slot_date = ?
      AND start_time < ?
      AND end_time > ?
      ${consultationType ? "AND consultation_type = ?" : ""}
    ${ignoreSlotId ? "AND id <> ?" : ""}
    LIMIT 1`;
  const base = [doctorId, slotDate, endTime, startTime];
  if (consultationType) base.push(consultationType);
  const params = ignoreSlotId ? [...base, ignoreSlotId] : base;
  const [rows] = await pool.execute(sql, params);
  if (rows[0]) {
    throw new AppError(409, "Давхардсан цагийн слот байна. Эхлэх/дуусах цагаа шалгана уу.");
  }
}

async function createSlot(ownerUserId, body) {
  const { doctor_id, service_id, slot_date, start_time, end_time, is_available } = body;
  const consultation_type =
    body.consultation_type && isConsultationType(body.consultation_type)
      ? body.consultation_type
      : CONSULTATION_TYPES.PAID_VISIT;
  if (!doctor_id || !slot_date || !start_time || !end_time) {
    throw new AppError(400, "doctor_id, slot_date, start_time, end_time заавал.");
  }
  await assertDoctorOwnedByProvider(doctor_id, ownerUserId);
  if (consultation_type === CONSULTATION_TYPES.PAID_VISIT && !service_id) {
    throw new AppError(400, "Төлбөртэй үзлэгийн цагт үйлчилгээ сонгоно уу.");
  }
  if (service_id) {
    const [sv] = await pool.execute(
      `SELECT id FROM services WHERE id = ? AND (clinic_id = (SELECT clinic_id FROM doctors WHERE id = ?) OR doctor_id = ?) LIMIT 1`,
      [service_id, doctor_id, doctor_id],
    );
    if (!sv[0]) {
      throw new AppError(400, "Үйлчилгээ эмч эсвэл эмнэлэгт тохирохгүй байна.");
    }
  }
  const startMinutes = parseTimeToMinutes(start_time);
  const endMinutes = parseTimeToMinutes(end_time);
  if (endMinutes <= startMinutes) {
    throw new AppError(400, "Дуусах цаг эхлэх цагаас хойш байх ёстой.");
  }
  await assertNoOverlappingSlot({
    doctorId: Number(doctor_id),
    slotDate: slot_date,
    startTime: minutesToTime(startMinutes),
    endTime: minutesToTime(endMinutes),
    consultationType: consultation_type,
  });
  try {
    const [result] = await pool.execute(
      `INSERT INTO schedule_slots (doctor_id, service_id, slot_date, start_time, end_time, is_available, slot_status, consultation_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        doctor_id,
        consultation_type === CONSULTATION_TYPES.FREE_CONSULTATION ? null : (service_id ?? null),
        slot_date,
        minutesToTime(startMinutes),
        minutesToTime(endMinutes),
        is_available === false ? 0 : 1,
        is_available === false ? "unavailable" : "available",
        consultation_type,
      ],
    );
    return getSlotById(result.insertId);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      throw new AppError(409, "Энэ эмчийн ижил цаг аль хэдийн бүртгэгдсэн байна.");
    }
    throw err;
  }
}

function buildSlotListWhere(listQuery) {
  const where = [`1=1`];
  const params = [];
  if (listQuery.doctor_id) {
    where.push(`doctor_id = ?`);
    params.push(listQuery.doctor_id);
  }
  if (listQuery.from_date) {
    where.push(`slot_date >= ?`);
    params.push(listQuery.from_date);
  }
  if (listQuery.to_date) {
    where.push(`slot_date <= ?`);
    params.push(listQuery.to_date);
  }
  return { where, params };
}

async function listSlots(listQuery) {
  const { where, params } = buildSlotListWhere(listQuery);
  const ws = where.join(" AND ");
  const [[countRow]] = await pool.execute(`SELECT COUNT(*) AS c FROM schedule_slots WHERE ${ws}`, params);
  const total = Number(countRow?.c || 0);
  const dir = listQuery.sortDir === "DESC" ? "DESC" : "ASC";
  const [rows] = await pool.execute(
    `SELECT id, doctor_id, service_id, slot_date, start_time, end_time, is_available, slot_status
     FROM schedule_slots WHERE ${ws}
     ORDER BY slot_date ${dir}, start_time ${dir}
     ${sqlLimitOffset(listQuery, { max: 200 })}`,
    params,
  );
  return { items: rows, total };
}

async function getSlotById(id) {
  const [rows] = await pool.execute(
    `SELECT id, doctor_id, service_id, slot_date, start_time, end_time, is_available, slot_status
     FROM schedule_slots WHERE id = ?`,
    [id],
  );
  if (!rows[0]) {
    throw new AppError(404, "Цагийн слот олдсонгүй.");
  }
  return rows[0];
}

async function updateSlot(slotId, ownerUserId, body) {
  await assertSlotOwnedByProvider(slotId, ownerUserId);
  const current = await getSlotById(slotId);
  const fields = [];
  const values = [];
  const allowed = ["service_id", "slot_date", "start_time", "end_time", "is_available", "slot_status"];
  for (const key of allowed) {
    if (body[key] !== undefined) {
      fields.push(`${key} = ?`);
      if (key === "is_available") {
        values.push(body[key] ? 1 : 0);
      } else if (key === "slot_status") {
        const allowedStatuses = ["available", "booked", "blocked", "unavailable"];
        if (!allowedStatuses.includes(body[key])) {
          throw new AppError(400, "slot_status буруу байна.");
        }
        values.push(body[key]);
      } else {
        values.push(body[key]);
      }
    }
  }
  if (fields.length === 0) {
    throw new AppError(400, "Шинэчлэх талбар байхгүй байна.");
  }
  const nextSlotDate = body.slot_date ?? current.slot_date;
  const nextStart = body.start_time ?? current.start_time;
  const nextEnd = body.end_time ?? current.end_time;
  const nextDoctorId = current.doctor_id;
  const startMinutes = parseTimeToMinutes(nextStart);
  const endMinutes = parseTimeToMinutes(nextEnd);
  if (endMinutes <= startMinutes) {
    throw new AppError(400, "Дуусах цаг эхлэх цагаас хойш байх ёстой.");
  }
  await assertNoOverlappingSlot({
    doctorId: Number(nextDoctorId),
    slotDate: nextSlotDate,
    startTime: minutesToTime(startMinutes),
    endTime: minutesToTime(endMinutes),
    ignoreSlotId: Number(slotId),
  });
  values.push(slotId);
  try {
    await pool.execute(`UPDATE schedule_slots SET ${fields.join(", ")} WHERE id = ?`, values);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      throw new AppError(409, "Энэ эмчийн ижил цаг аль хэдийн байна.");
    }
    throw err;
  }
  return getSlotById(slotId);
}

async function saveDoctorWeeklySchedule(ownerUserId, doctorId, weeklySchedule = []) {
  await assertDoctorOwnedByProvider(doctorId, ownerUserId);
  if (!Array.isArray(weeklySchedule) || weeklySchedule.length === 0) {
    throw new AppError(400, "weekly_schedule хоосон байна.");
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute(`DELETE FROM doctor_weekly_schedules WHERE doctor_id = ?`, [doctorId]);

    for (const item of weeklySchedule) {
      const weekday = Number(item.weekday);
      if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
        throw new AppError(400, "weekday 0-6 хооронд байна.");
      }
      const startMinutes = parseTimeToMinutes(item.start_time);
      const endMinutes = parseTimeToMinutes(item.end_time);
      if (endMinutes <= startMinutes) {
        throw new AppError(400, "Ажиллах цагийн төгсгөл эхлэлээс их байна.");
      }
      await conn.execute(
        `INSERT INTO doctor_weekly_schedules (doctor_id, weekday, start_time, end_time, is_active)
         VALUES (?, ?, ?, ?, ?)`,
        [doctorId, weekday, minutesToTime(startMinutes), minutesToTime(endMinutes), asBool(item.is_active, true) ? 1 : 0],
      );
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  return listWeeklyScheduleByDoctor(doctorId);
}

async function listWeeklyScheduleByDoctor(doctorId) {
  const [rows] = await pool.execute(
    `SELECT id, doctor_id, weekday, start_time, end_time, is_active
     FROM doctor_weekly_schedules
     WHERE doctor_id = ?
     ORDER BY weekday ASC`,
    [doctorId],
  );
  return rows;
}

function toDateOnly(date) {
  return new Date(`${date}T00:00:00`);
}

function formatDate(d) {
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function generateSlotsFromWeeklySchedule(ownerUserId, body) {
  const doctorId = Number(body.doctor_id);
  const serviceId = Number(body.service_id);
  const fromDate = String(body.from_date || "").trim();
  const toDate = String(body.to_date || "").trim();
  if (!doctorId || !serviceId || !fromDate || !toDate) {
    throw new AppError(400, "doctor_id, service_id, from_date, to_date заавал.");
  }
  await assertDoctorOwnedByProvider(doctorId, ownerUserId);

  const [serviceRows] = await pool.execute(
    `SELECT s.* FROM services s
     INNER JOIN doctors d ON d.id = s.doctor_id OR (s.doctor_id IS NULL AND s.clinic_id = d.clinic_id)
     INNER JOIN clinics c ON c.id = d.clinic_id
     WHERE s.id = ? AND d.id = ? AND c.owner_user_id = ? LIMIT 1`,
    [serviceId, doctorId, ownerUserId],
  );
  const service = serviceRows[0];
  if (!service) {
    throw new AppError(400, "Үйлчилгээ энэ эмч/эмнэлэгт хамаарахгүй байна.");
  }

  const weeklyRows = await listWeeklyScheduleByDoctor(doctorId);
  const activeWeekly = weeklyRows.filter((row) => Number(row.is_active) === 1);
  if (activeWeekly.length === 0) {
    throw new AppError(400, "Эмчийн идэвхтэй weekly schedule алга.");
  }

  const duration = Number(service.duration_minutes || 30);
  const start = toDateOnly(fromDate);
  const end = toDateOnly(toDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    throw new AppError(400, "from_date/to_date буруу байна.");
  }

  let generated = 0;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
      const weekday = cursor.getDay();
      const daySchedule = activeWeekly.find((row) => Number(row.weekday) === weekday);
      if (!daySchedule) continue;

      const day = formatDate(cursor);
      const startMinutes = parseTimeToMinutes(daySchedule.start_time);
      const endMinutes = parseTimeToMinutes(daySchedule.end_time);
      for (let m = startMinutes; m + duration <= endMinutes; m += duration) {
        const slotStart = minutesToTime(m);
        const slotEnd = minutesToTime(m + duration);
        try {
          await conn.execute(
            `INSERT INTO schedule_slots (doctor_id, service_id, slot_date, start_time, end_time, is_available, slot_status)
             VALUES (?, ?, ?, ?, ?, 1, 'available')`,
            [doctorId, serviceId, day, slotStart, slotEnd],
          );
          generated += 1;
        } catch (err) {
          if (err.code !== "ER_DUP_ENTRY") throw err;
        }
      }
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  return { doctor_id: doctorId, service_id: serviceId, generated_count: generated };
}

async function blockSlot(slotId, ownerUserId) {
  await assertSlotOwnedByProvider(slotId, ownerUserId);
  await pool.execute(`UPDATE schedule_slots SET is_available = 0, slot_status = 'blocked' WHERE id = ?`, [slotId]);
  return getSlotById(slotId);
}

async function markSlotUnavailable(slotId, ownerUserId) {
  await assertSlotOwnedByProvider(slotId, ownerUserId);
  await pool.execute(`UPDATE schedule_slots SET is_available = 0, slot_status = 'unavailable' WHERE id = ?`, [slotId]);
  return getSlotById(slotId);
}

async function listDoctorAvailableSlotsForCustomer(listQuery) {
  const doctor_id = listQuery.doctor_id;
  const where = [`doctor_id = ?`, `is_available = 1`, `slot_status = 'available'`];
  const params = [doctor_id];
  if (listQuery.consultation_type) {
    if (!isConsultationType(listQuery.consultation_type)) {
      throw new AppError(400, "consultation_type: paid_visit, free_consultation");
    }
    where.push(`consultation_type = ?`);
    params.push(listQuery.consultation_type);
  }
  if (listQuery.service_id) {
    // service_id NULL слотууд нь эмчийн ерөнхий боломжит цаг тул үйлчилгээ сонгосон үед ч харагдана.
    where.push(`(service_id = ? OR service_id IS NULL)`);
    params.push(listQuery.service_id);
  }
  if (listQuery.from_date) {
    where.push(`slot_date >= ?`);
    params.push(listQuery.from_date);
  }
  if (listQuery.to_date) {
    where.push(`slot_date <= ?`);
    params.push(listQuery.to_date);
  }
  const ws = where.join(" AND ");
  const [[countRow]] = await pool.execute(`SELECT COUNT(*) AS c FROM schedule_slots WHERE ${ws}`, params);
  const total = Number(countRow?.c || 0);
  const [rows] = await pool.execute(
    `SELECT id, doctor_id, service_id,
            DATE_FORMAT(slot_date, '%Y-%m-%d') AS slot_date,
            start_time, end_time, consultation_type
     FROM schedule_slots WHERE ${ws}
     ORDER BY slot_date ASC, start_time ASC
     ${sqlLimitOffset(listQuery, { max: 200 })}`,
    params,
  );
  return { items: rows, total };
}

module.exports = {
  createSlot,
  listSlots,
  getSlotById,
  updateSlot,
  saveDoctorWeeklySchedule,
  listWeeklyScheduleByDoctor,
  generateSlotsFromWeeklySchedule,
  blockSlot,
  markSlotUnavailable,
  listDoctorAvailableSlotsForCustomer,
};
