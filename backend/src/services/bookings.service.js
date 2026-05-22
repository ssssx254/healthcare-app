const { pool } = require("../config/database");
const { sqlLimitOffset } = require("../utils/paginationSql");
const { AppError } = require("../utils/appError");
const { assertPositiveIntId, assertOptionalMeetingUrl } = require("../utils/validation");
const { BOOKING_BUSINESS_RULES } = require("../constants/bookings");

const BOOKING_STATUSES = ["pending", "confirmed", "cancelled", "completed"];
const PAYMENT_STATUSES = ["unpaid", "paid", "refunded"];

function assertBookingStatus(status) {
  if (!BOOKING_STATUSES.includes(status)) {
    throw new AppError(400, "Захиалгын төлөв буруу байна.");
  }
}

function assertPaymentStatus(status) {
  if (!PAYMENT_STATUSES.includes(status)) {
    throw new AppError(400, "Төлбөрийн төлөв буруу байна.");
  }
}

async function getBookingRow(id, conn = pool, { forUpdate = false } = {}) {
  const suffix = forUpdate ? " FOR UPDATE" : "";
  const [rows] = await conn.execute(`SELECT * FROM bookings WHERE id = ? LIMIT 1${suffix}`, [id]);
  return rows[0] || null;
}

async function isProviderBookingOwner(bookingId, providerUserId, conn = pool) {
  const [rows] = await conn.execute(
    `SELECT b.id
     FROM bookings b
     INNER JOIN clinics c ON c.id = b.clinic_id
     WHERE b.id = ? AND c.owner_user_id = ?
     LIMIT 1`,
    [bookingId, providerUserId],
  );
  return Boolean(rows[0]);
}

function applyBookingFilters(query, params, filters = {}) {
  const { status, payment_status, clinic_id, doctor_id, from_date, to_date } = filters;
  if (status) {
    assertBookingStatus(status);
    query.push(`b.status = ?`);
    params.push(status);
  }
  if (payment_status) {
    assertPaymentStatus(payment_status);
    query.push(`b.payment_status = ?`);
    params.push(payment_status);
  }
  if (clinic_id) {
    query.push(`b.clinic_id = ?`);
    params.push(assertPositiveIntId(clinic_id, "clinic_id"));
  }
  if (doctor_id) {
    query.push(`b.doctor_id = ?`);
    params.push(assertPositiveIntId(doctor_id, "doctor_id"));
  }
  if (from_date) {
    query.push(`DATE(b.created_at) >= ?`);
    params.push(String(from_date));
  }
  if (to_date) {
    query.push(`DATE(b.created_at) <= ?`);
    params.push(String(to_date));
  }
}

async function attachSharedLabTestsToBooking(conn, patientUserId, bookingId, labTestIds) {
  const unique = [...new Set(labTestIds.map((id) => Number(id)).filter((id) => id > 0))];
  if (unique.length === 0) return;

  for (const labTestId of unique) {
    const [rows] = await conn.execute(
      `SELECT id FROM lab_tests
       WHERE id = ? AND patient_user_id = ? AND uploaded_by = 'customer'
       LIMIT 1`,
      [labTestId, patientUserId],
    );
    if (!rows[0]) {
      throw new AppError(400, "Зөвхөн өөрийн хадгалсан шинжилгээг эмчид хуваалцана.");
    }
  }

  for (const labTestId of unique) {
    await conn.execute(`INSERT INTO booking_lab_tests (booking_id, lab_test_id) VALUES (?, ?)`, [
      bookingId,
      labTestId,
    ]);
  }
}

async function createBooking(patientUserId, body) {
  const clinicId = assertPositiveIntId(body.clinic_id, "clinic_id");
  const doctorId = assertPositiveIntId(body.doctor_id, "doctor_id");
  const serviceId = assertPositiveIntId(body.service_id, "service_id");
  const slotId = assertPositiveIntId(body.slot_id, "slot_id");

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [doctorRows] = await conn.execute(
      `SELECT id, clinic_id FROM doctors WHERE id = ? AND clinic_id = ? LIMIT 1`,
      [doctorId, clinicId],
    );
    if (!doctorRows[0]) {
      throw new AppError(400, "Сонгосон эмч хүчинтэй биш байна.");
    }

    const [serviceRows] = await conn.execute(
      `SELECT id, clinic_id, doctor_id, price, is_active, is_free_consultation
       FROM services WHERE id = ? AND clinic_id = ? LIMIT 1`,
      [serviceId, clinicId],
    );
    const service = serviceRows[0];
    if (!service || Number(service.is_active) !== 1) {
      throw new AppError(400, "Сонгосон үйлчилгээ хүчинтэй биш байна.");
    }
    if (Number(service.is_free_consultation) === 1) {
      throw new AppError(
        400,
        `Үнэгүй онлайн зөвлөгөөнд ${BOOKING_BUSINESS_RULES.FREE_CONSULTATION_PATH} хүсэлт үүсгэнэ. Энэ endpoint нь зөвхөн төлбөртэй цагийн захиалгад.`,
      );
    }
    if (!(Number(service.price) > 0)) {
      throw new AppError(400, "Төлбөртэй захиалгад үйлчилгээний үнэ 0-ээс их байх ёстой.");
    }
    if (service.doctor_id != null && Number(service.doctor_id) !== doctorId) {
      throw new AppError(400, "Сонгосон үйлчилгээ эмчтэй таарахгүй байна.");
    }

    const [slotRows] = await conn.execute(
      `SELECT id, doctor_id, service_id, is_available, slot_status
       FROM schedule_slots
       WHERE id = ? AND doctor_id = ?
       FOR UPDATE`,
      [slotId, doctorId],
    );
    const slot = slotRows[0];
    if (!slot) {
      throw new AppError(400, "Сонгосон цаг хүчинтэй биш байна.");
    }
    if (slot.service_id != null && Number(slot.service_id) !== serviceId) {
      throw new AppError(400, "Сонгосон цаг үйлчилгээтэй таарахгүй байна.");
    }
    if (Number(slot.is_available) !== 1 || slot.slot_status !== "available") {
      throw new AppError(409, "Сонгосон цаг аль хэдийн захиалагдсан байна.");
    }

    await conn.execute(`UPDATE schedule_slots SET is_available = 0, slot_status = 'booked' WHERE id = ?`, [slotId]);

    const [result] = await conn.execute(
      `INSERT INTO bookings (
        patient_user_id, clinic_id, doctor_id, service_id, slot_id,
        booking_type, status, payment_required, payment_status, total_amount, meeting_link
      ) VALUES (?, ?, ?, ?, ?, 'formal', 'pending', 1, 'unpaid', ?, NULL)`,
      [patientUserId, clinicId, doctorId, serviceId, slotId, Number(service.price || 0)],
    );

    const bookingId = result.insertId;
    if (Array.isArray(body.lab_test_ids) && body.lab_test_ids.length > 0) {
      await attachSharedLabTestsToBooking(conn, patientUserId, bookingId, body.lab_test_ids);
    }

    await conn.commit();
    const created = await getBookingRow(bookingId);
    void require("./notificationTriggers.service").onBookingCreated(created);
    return created;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

function bookingFilterSubset(listQuery) {
  return {
    status: listQuery.status,
    payment_status: listQuery.payment_status,
    clinic_id: listQuery.clinic_id,
    doctor_id: listQuery.doctor_id,
    from_date: listQuery.from_date,
    to_date: listQuery.to_date,
  };
}

async function listCustomerBookings(userId, listQuery) {
  const filters = bookingFilterSubset(listQuery);
  const where = [`b.patient_user_id = ?`];
  const params = [userId];
  applyBookingFilters(where, params, filters);
  const whereSql = where.join(" AND ");
  const [[countRow]] = await pool.execute(`SELECT COUNT(*) AS c FROM bookings b WHERE ${whereSql}`, params);
  const total = Number(countRow?.c || 0);
  const dir = listQuery.sortDir === "ASC" ? "ASC" : "DESC";
  const [rows] = await pool.execute(
    `SELECT b.* FROM bookings b WHERE ${whereSql} ORDER BY b.created_at ${dir}${sqlLimitOffset(listQuery)}`,
    params,
  );
  return { items: rows, total };
}

async function listProviderBookings(providerUserId, listQuery) {
  const filters = bookingFilterSubset(listQuery);
  const where = [`c.owner_user_id = ?`];
  const params = [providerUserId];
  applyBookingFilters(where, params, filters);
  const whereSql = where.join(" AND ");
  const [[countRow]] = await pool.execute(
    `SELECT COUNT(*) AS c FROM bookings b INNER JOIN clinics c ON c.id = b.clinic_id WHERE ${whereSql}`,
    params,
  );
  const total = Number(countRow?.c || 0);
  const dir = listQuery.sortDir === "ASC" ? "ASC" : "DESC";
  const [rows] = await pool.execute(
    `SELECT b.*
     FROM bookings b
     INNER JOIN clinics c ON c.id = b.clinic_id
     WHERE ${whereSql}
     ORDER BY b.created_at ${dir}
     ${sqlLimitOffset(listQuery)}`,
    params,
  );
  return { items: rows, total };
}

async function listBookings(user, listQuery) {
  if (user.role === "customer") return listCustomerBookings(user.id, listQuery);
  if (user.role === "provider") return listProviderBookings(user.id, listQuery);
  throw new AppError(403, "Захиалгын жагсаалтыг харах эрхгүй.");
}

async function listBookingSharedLabTests(bookingId, user) {
  await getBookingById(bookingId, user);
  const id = assertPositiveIntId(bookingId, "booking_id");
  const labTestsRepo = require("../repositories/labTests.repository");
  const items = await labTestsRepo.listForBooking(id);
  return { items };
}

async function getBookingById(bookingId, user) {
  const id = assertPositiveIntId(bookingId, "booking_id");
  const row = await getBookingRow(id);
  if (!row) throw new AppError(404, "Захиалга олдсонгүй.");
  if (user.role === "customer" && row.patient_user_id !== user.id) {
    throw new AppError(403, "Захиалгыг харах эрхгүй.");
  }
  if (user.role === "provider" && !(await isProviderBookingOwner(id, user.id))) {
    throw new AppError(403, "Захиалгыг харах эрхгүй.");
  }
  if (!["customer", "provider", "system_admin"].includes(user.role)) {
    throw new AppError(403, "Захиалгыг харах эрхгүй.");
  }
  return row;
}

async function markBookingPaid(bookingId, user, paymentBody = {}) {
  if (user.role !== "customer") {
    throw new AppError(403, "Төлбөрийг зөвхөн үйлчлүүлэгч бүртгэнэ.");
  }
  const id = assertPositiveIntId(bookingId, "booking_id");
  const row = await getBookingById(id, user);
  if (row.status === "cancelled") {
    throw new AppError(400, "Цуцлагдсан захиалгад төлбөр хийхгүй.");
  }
  const walletService = require("./wallet.service");
  return walletService.payBooking(user, {
    booking_id: id,
    channel: paymentBody.channel || "wallet",
    payment_method_id: paymentBody.payment_method_id,
    qpay_invoice_id: paymentBody.qpay_invoice_id,
  });
}

function assertProviderStatusTransition(currentStatus, nextStatus) {
  assertBookingStatus(nextStatus);
  if (nextStatus === "pending") {
    throw new AppError(400, "pending төлөв рүү буцаах боломжгүй.");
  }
  if (currentStatus === "cancelled") {
    throw new AppError(400, "Цуцлагдсан захиалга дахин өөрчлөгдөхгүй.");
  }
  if (currentStatus === "completed") {
    throw new AppError(400, "Дууссан захиалга дахин өөрчлөгдөхгүй.");
  }
  if (nextStatus === "completed" && currentStatus !== "confirmed") {
    throw new AppError(400, "Зөвхөн confirmed захиалгыг completed болгоно.");
  }
}

async function releaseSlotIfNeeded(conn, booking) {
  if (booking.slot_id) {
    await conn.execute(`UPDATE schedule_slots SET is_available = 1, slot_status = 'available' WHERE id = ?`, [
      booking.slot_id,
    ]);
  }
}

async function updateBookingStatus(bookingId, user, body) {
  const id = assertPositiveIntId(bookingId, "booking_id");
  const { status, meeting_link } = body;

  const walletService = require("./wallet.service");

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const row = await getBookingRow(id, conn, { forUpdate: true });
    if (!row) throw new AppError(404, "Захиалга олдсонгүй.");

    if (user.role === "customer") {
      if (row.patient_user_id !== user.id) throw new AppError(403, "Төлөв өөрчлөх эрхгүй.");
      if (status && status !== "cancelled") {
        throw new AppError(403, "Үйлчлүүлэгч зөвхөн cancel хийх эрхтэй.");
      }
      if (status === "cancelled") {
        if (!["pending", "confirmed"].includes(row.status)) {
          throw new AppError(400, "Энэ төлөвөөс цуцлах боломжгүй.");
        }
        await walletService.refundBookingToWalletIfPaid(row, conn);
        await conn.execute(
          `UPDATE bookings SET status = 'cancelled', payment_status = IF(payment_status='paid','refunded',payment_status) WHERE id = ?`,
          [id],
        );
        await releaseSlotIfNeeded(conn, row);
      }
    } else if (user.role === "provider") {
      const owns = await isProviderBookingOwner(id, user.id, conn);
      if (!owns) throw new AppError(403, "Төлөв өөрчлөх эрхгүй.");
      if (status) {
        assertProviderStatusTransition(row.status, status);
        await conn.execute(`UPDATE bookings SET status = ? WHERE id = ?`, [status, id]);
        if (status === "cancelled") {
          await walletService.refundBookingToWalletIfPaid(row, conn);
          await conn.execute(
            `UPDATE bookings SET payment_status = IF(payment_status='paid','refunded',payment_status) WHERE id = ?`,
            [id],
          );
          await releaseSlotIfNeeded(conn, row);
        }
      }
    } else {
      throw new AppError(403, "Төлөв өөрчлөх эрхгүй.");
    }

    if (meeting_link !== undefined) {
      const meetingLink = meeting_link === null || meeting_link === "" ? null : assertOptionalMeetingUrl(meeting_link);
      await conn.execute(`UPDATE bookings SET meeting_link = ? WHERE id = ?`, [meetingLink, id]);
    }

    await conn.commit();
    const updated = await getBookingRow(id);
    const triggers = require("./notificationTriggers.service");
    if (status === "confirmed") {
      void triggers.onBookingConfirmed(updated);
    }
    if (status === "cancelled") {
      void triggers.onBookingCancelled(updated);
    }
    return updated;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function cancelBooking(bookingId, user) {
  return updateBookingStatus(bookingId, user, { status: "cancelled" });
}

module.exports = {
  createBooking,
  listBookings,
  listCustomerBookings,
  listProviderBookings,
  getBookingById,
  listBookingSharedLabTests,
  updateBookingStatus,
  cancelBooking,
  markBookingPaid,
};
