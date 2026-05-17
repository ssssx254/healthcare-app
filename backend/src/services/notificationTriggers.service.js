/**
 * Domain үйл явдлуудаас мэдэгдэл илгээх — bookings / consultations-аас дуудна.
 * Алдаа гарвал захиалга/хүсэлтийн үндсэн урсгалыг эвдэхгүйгээр try/catch.
 */
const { pool } = require("../config/database");
const notificationsService = require("./notifications.service");
const { NOTIFICATION_TYPES, REFERENCE_TYPES } = require("../constants/notifications");

async function getClinicOwnerUserId(clinicId) {
  const [rows] = await pool.execute(`SELECT owner_user_id FROM clinics WHERE id = ? LIMIT 1`, [clinicId]);
  return rows[0]?.owner_user_id ?? null;
}

async function safe(fn) {
  try {
    await fn();
  } catch (err) {
    console.error("[notificationTriggers]", err.message || err);
  }
}

async function onBookingCreated(booking) {
  await safe(async () => {
    const providerId = await getClinicOwnerUserId(booking.clinic_id);
    const meta = { booking_id: booking.id, clinic_id: booking.clinic_id };
    await notificationsService.createNotification({
      user_id: booking.patient_user_id,
      title: "Захиалга илгээгдлээ",
      body: `Таны цагийн захиалга (#${booking.id}) эмнэлэгт илгээгдлээ.`,
      type: NOTIFICATION_TYPES.BOOKING_CREATED,
      reference_type: REFERENCE_TYPES.BOOKING,
      reference_id: booking.id,
      metadata: meta,
    });
    if (providerId) {
      await notificationsService.createNotification({
        user_id: providerId,
        title: "Шинэ захиалга",
        body: `Өвчтөн цагийн захиалга (#${booking.id}) илгээлээ.`,
        type: NOTIFICATION_TYPES.BOOKING_CREATED,
        reference_type: REFERENCE_TYPES.BOOKING,
        reference_id: booking.id,
        metadata: meta,
      });
    }
  });
}

async function onBookingConfirmed(booking) {
  await safe(async () => {
    await notificationsService.createNotification({
      user_id: booking.patient_user_id,
      title: "Захиалга баталгаажлаа",
      body: `Таны захиалга (#${booking.id}) баталгаажлаа.`,
      type: NOTIFICATION_TYPES.BOOKING_CONFIRMED,
      reference_type: REFERENCE_TYPES.BOOKING,
      reference_id: booking.id,
      metadata: { booking_id: booking.id },
    });
  });
}

async function onBookingCancelled(booking) {
  await safe(async () => {
    const providerId = await getClinicOwnerUserId(booking.clinic_id);
    const meta = { booking_id: booking.id };
    await notificationsService.createNotification({
      user_id: booking.patient_user_id,
      title: "Захиалга цуцлагдлаа",
      body: `Таны захиалга (#${booking.id}) цуцлагдсан байна.`,
      type: NOTIFICATION_TYPES.BOOKING_CANCELLED,
      reference_type: REFERENCE_TYPES.BOOKING,
      reference_id: booking.id,
      metadata: meta,
    });
    if (providerId) {
      await notificationsService.createNotification({
        user_id: providerId,
        title: "Захиалга цуцлагдлаа",
        body: `Захиалга (#${booking.id}) цуцлагдсан байна.`,
        type: NOTIFICATION_TYPES.BOOKING_CANCELLED,
        reference_type: REFERENCE_TYPES.BOOKING,
        reference_id: booking.id,
        metadata: meta,
      });
    }
  });
}

async function onConsultationCreated(consultation) {
  await safe(async () => {
    const providerId = await getClinicOwnerUserId(consultation.clinic_id);
    if (!providerId) return;
    await notificationsService.createNotification({
      user_id: providerId,
      title: "Үнэгүй зөвлөгөөний хүсэлт",
      body: `Өвчтөн шинэ онлайн зөвлөгөөний хүсэлт (#${consultation.id}) илгээлээ.`,
      type: NOTIFICATION_TYPES.CONSULTATION_CREATED,
      reference_type: REFERENCE_TYPES.CONSULTATION_REQUEST,
      reference_id: consultation.id,
      metadata: { consultation_request_id: consultation.id, clinic_id: consultation.clinic_id },
    });
  });
}

async function onConsultationAccepted(consultation) {
  await safe(async () => {
    await notificationsService.createNotification({
      user_id: consultation.patient_user_id,
      title: "Зөвлөгөө хүлээн авлаа",
      body: `Таны зөвлөгөөний хүсэлт (#${consultation.id}) эмнэлгээр хүлээн авлаа.`,
      type: NOTIFICATION_TYPES.CONSULTATION_ACCEPTED,
      reference_type: REFERENCE_TYPES.CONSULTATION_REQUEST,
      reference_id: consultation.id,
      metadata: { consultation_request_id: consultation.id },
    });
  });
}

module.exports = {
  onBookingCreated,
  onBookingConfirmed,
  onBookingCancelled,
  onConsultationCreated,
  onConsultationAccepted,
};
