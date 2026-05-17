const { pool } = require("../config/database");
const { AppError } = require("../utils/appError");
const { assertPositiveIntId, optionalTrimmedString } = require("../utils/validation");
const { LAB_RESULT_SOURCE, isLabResultSource } = require("../constants/medicalRecords");
const medicalRecordsRepo = require("../repositories/medicalRecords.repository");

async function assertClinicOwnedByProvider(clinicId, providerUserId) {
  const [rows] = await pool.execute(`SELECT id FROM clinics WHERE id = ? AND owner_user_id = ? LIMIT 1`, [
    clinicId,
    providerUserId,
  ]);
  if (!rows[0]) {
    throw new AppError(403, "Энэ эмнэлгийн эрхгүй.");
  }
}

async function assertDoctorInClinic(doctorId, clinicId) {
  const [rows] = await pool.execute(`SELECT id FROM doctors WHERE id = ? AND clinic_id = ? LIMIT 1`, [
    doctorId,
    clinicId,
  ]);
  if (!rows[0]) {
    throw new AppError(400, "Эмч энэ эмнэлэгт бүртгэлгүй байна.");
  }
}

async function assertPatientHasBookingWithClinic(patientUserId, clinicId) {
  const [rows] = await pool.execute(
    `SELECT id FROM bookings WHERE patient_user_id = ? AND clinic_id = ? LIMIT 1`,
    [patientUserId, clinicId],
  );
  if (!rows[0]) {
    throw new AppError(400, "Энэ өвчтөнтэй эмнэлгийн захиалгын түүх олдсонгүй.");
  }
}

async function assertPatientVisibleToProvider(patientUserId, providerUserId) {
  const [rows] = await pool.execute(
    `SELECT b.id FROM bookings b
     INNER JOIN clinics c ON c.id = b.clinic_id
     WHERE b.patient_user_id = ? AND c.owner_user_id = ?
     LIMIT 1`,
    [patientUserId, providerUserId],
  );
  if (!rows[0]) {
    throw new AppError(403, "Энэ өвчтөний түүхийг харах эрхгүй.");
  }
}

async function getBookingForProvider(bookingId, providerUserId) {
  const [rows] = await pool.execute(
    `SELECT b.* FROM bookings b
     INNER JOIN clinics c ON c.id = b.clinic_id
     WHERE b.id = ? AND c.owner_user_id = ?
     LIMIT 1`,
    [bookingId, providerUserId],
  );
  return rows[0] || null;
}

async function getBookingForPatient(bookingId, patientUserId) {
  const [rows] = await pool.execute(
    `SELECT * FROM bookings WHERE id = ? AND patient_user_id = ? LIMIT 1`,
    [bookingId, patientUserId],
  );
  return rows[0] || null;
}

function normalizeNoteTexts(body) {
  return {
    diagnosis: optionalTrimmedString(body.diagnosis, 4000),
    doctor_notes: optionalTrimmedString(body.doctor_notes, 4000),
    recommendation: optionalTrimmedString(body.recommendation, 4000),
    treatment_plan: optionalTrimmedString(body.treatment_plan, 4000),
  };
}

/** Provider: эмчийн тэмдэглэл үүсгэх (захиалгатай эсвэл өвчтөн–эмнэлгийн түүхтэй). */
async function createMedicalNote(providerUserId, body) {
  const patientUserId = assertPositiveIntId(body.patient_user_id, "patient_user_id");
  const clinicId = assertPositiveIntId(body.clinic_id, "clinic_id");
  const doctorId = assertPositiveIntId(body.doctor_id, "doctor_id");
  const bookingId =
    body.booking_id !== undefined && body.booking_id !== null && body.booking_id !== ""
      ? assertPositiveIntId(body.booking_id, "booking_id")
      : null;

  await assertClinicOwnedByProvider(clinicId, providerUserId);
  await assertDoctorInClinic(doctorId, clinicId);

  let bookingIdVal = bookingId;
  if (bookingIdVal) {
    const b = await getBookingForProvider(bookingIdVal, providerUserId);
    if (!b) {
      throw new AppError(404, "Захиалга олдсонгүй эсвэл энэ эмнэлгийн биш байна.");
    }
    if (Number(b.patient_user_id) !== patientUserId) {
      throw new AppError(400, "Захиалга өвчтөний мэдээлэлтэй таарахгүй байна.");
    }
    if (Number(b.clinic_id) !== clinicId || Number(b.doctor_id) !== doctorId) {
      throw new AppError(400, "Захиалга эмнэлэг/эмчтэй таарахгүй байна.");
    }
  } else {
    await assertPatientHasBookingWithClinic(patientUserId, clinicId);
  }

  const texts = normalizeNoteTexts(body);
  if (!texts.diagnosis && !texts.doctor_notes && !texts.recommendation && !texts.treatment_plan) {
    throw new AppError(400, "Дор хаяж нэг талбар (онош, тэмдэглэл, зөвлөмж, эмчилгээний төлөвлөгөө) оруулна уу.");
  }

  return medicalRecordsRepo.insertMedicalNote({
    patient_user_id: patientUserId,
    clinic_id: clinicId,
    doctor_id: doctorId,
    booking_id: bookingIdVal,
    diagnosis: texts.diagnosis,
    doctor_notes: texts.doctor_notes,
    recommendation: texts.recommendation,
    treatment_plan: texts.treatment_plan,
    created_by_user_id: providerUserId,
  });
}

async function listMedicalNotesForPatientQuery(providerUserId, query) {
  const patientUserId = assertPositiveIntId(query.patient_user_id, "patient_user_id");
  await assertPatientVisibleToProvider(patientUserId, providerUserId);
  if (query.clinic_id) {
    await assertClinicOwnedByProvider(assertPositiveIntId(query.clinic_id, "clinic_id"), providerUserId);
  }
  return medicalRecordsRepo.listMedicalNotesForPatient(patientUserId, providerUserId, {
    clinic_id: query.clinic_id,
    doctor_id: query.doctor_id,
    booking_id: query.booking_id,
  });
}

async function listMyMedicalNotes(customerUserId) {
  return medicalRecordsRepo.listMedicalNotesForCustomer(customerUserId);
}

/** Provider: жорын мөр нэмэх */
async function createPrescription(providerUserId, body) {
  const patientUserId = assertPositiveIntId(body.patient_user_id, "patient_user_id");
  const clinicId = assertPositiveIntId(body.clinic_id, "clinic_id");
  const doctorId = assertPositiveIntId(body.doctor_id, "doctor_id");
  const bookingId =
    body.booking_id !== undefined && body.booking_id !== null && body.booking_id !== ""
      ? assertPositiveIntId(body.booking_id, "booking_id")
      : null;

  const medicineName = optionalTrimmedString(body.medicine_name, 255);
  const dosage = optionalTrimmedString(body.dosage, 255);
  const duration = optionalTrimmedString(body.duration, 191);
  if (!medicineName) throw new AppError(400, "Эмийн нэр оруулна уу.");
  if (!dosage) throw new AppError(400, "Тун оруулна уу.");
  if (!duration) throw new AppError(400, "Хугацаа оруулна уу.");
  const instructions = optionalTrimmedString(body.instructions, 4000);

  await assertClinicOwnedByProvider(clinicId, providerUserId);
  await assertDoctorInClinic(doctorId, clinicId);

  if (bookingId) {
    const b = await getBookingForProvider(bookingId, providerUserId);
    if (!b) throw new AppError(404, "Захиалга олдсонгүй эсвэл энэ эмнэлгийн биш байна.");
    if (Number(b.patient_user_id) !== patientUserId) {
      throw new AppError(400, "Захиалга өвчтөний мэдээлэлтэй таарахгүй байна.");
    }
    if (Number(b.clinic_id) !== clinicId || Number(b.doctor_id) !== doctorId) {
      throw new AppError(400, "Захиалга эмнэлэг/эмчтэй таарахгүй байна.");
    }
  } else {
    await assertPatientHasBookingWithClinic(patientUserId, clinicId);
  }

  return medicalRecordsRepo.insertPrescription({
    patient_user_id: patientUserId,
    clinic_id: clinicId,
    doctor_id: doctorId,
    booking_id: bookingId,
    medicine_name: medicineName,
    dosage,
    instructions,
    duration,
    created_by_user_id: providerUserId,
  });
}

async function listPrescriptionsForPatientQuery(providerUserId, query) {
  const patientUserId = assertPositiveIntId(query.patient_user_id, "patient_user_id");
  await assertPatientVisibleToProvider(patientUserId, providerUserId);
  if (query.clinic_id) {
    await assertClinicOwnedByProvider(assertPositiveIntId(query.clinic_id, "clinic_id"), providerUserId);
  }
  return medicalRecordsRepo.listPrescriptionsForPatient(patientUserId, providerUserId, {
    clinic_id: query.clinic_id,
    doctor_id: query.doctor_id,
    booking_id: query.booking_id,
  });
}

async function listMyPrescriptions(customerUserId) {
  return medicalRecordsRepo.listPrescriptionsForCustomer(customerUserId);
}

/** Шинжилгээний metadata: эмнэлэг эсвэл өвчтөн илгээнэ */
async function createLabTestResult(user, body) {
  const title = optionalTrimmedString(body.title, 255);
  if (!title) throw new AppError(400, "Гарчиг оруулна уу.");
  const filePlaceholder = optionalTrimmedString(body.file_placeholder, 512);
  const notes = optionalTrimmedString(body.notes, 4000);
  const rawSource = String(body.source || "").trim();
  if (!isLabResultSource(rawSource)) {
    throw new AppError(400, "source нь customer_uploaded эсвэл clinic_uploaded байна.");
  }

  if (user.role === "provider") {
    if (rawSource !== LAB_RESULT_SOURCE.CLINIC_UPLOADED) {
      throw new AppError(400, "Эмнэлгийн оруулалтад source=clinic_uploaded ашиглана.");
    }
    const patientUserId = assertPositiveIntId(body.patient_user_id, "patient_user_id");
    const clinicId = assertPositiveIntId(body.clinic_id, "clinic_id");
    await assertClinicOwnedByProvider(clinicId, user.id);
    const doctorId =
      body.doctor_id !== undefined && body.doctor_id !== null && body.doctor_id !== ""
        ? assertPositiveIntId(body.doctor_id, "doctor_id")
        : null;
    if (doctorId) await assertDoctorInClinic(doctorId, clinicId);
    const bookingId =
      body.booking_id !== undefined && body.booking_id !== null && body.booking_id !== ""
        ? assertPositiveIntId(body.booking_id, "booking_id")
        : null;
    if (bookingId) {
      const b = await getBookingForProvider(bookingId, user.id);
      if (!b) throw new AppError(404, "Захиалга олдсонгүй.");
      if (Number(b.patient_user_id) !== patientUserId || Number(b.clinic_id) !== clinicId) {
        throw new AppError(400, "Захиалга өвчтөн/эмнэлэгтэй таарахгүй байна.");
      }
    } else {
      await assertPatientHasBookingWithClinic(patientUserId, clinicId);
    }
    return medicalRecordsRepo.insertLabTestResult({
      patient_user_id: patientUserId,
      clinic_id: clinicId,
      doctor_id: doctorId,
      booking_id: bookingId,
      title,
      file_placeholder: filePlaceholder,
      notes,
      source: LAB_RESULT_SOURCE.CLINIC_UPLOADED,
      created_by_user_id: user.id,
    });
  }

  if (user.role === "customer") {
    if (rawSource !== LAB_RESULT_SOURCE.CUSTOMER_UPLOADED) {
      throw new AppError(400, "Өөрийн оруулалтад source=customer_uploaded ашиглана.");
    }
    const patientUserId = user.id;
    let clinicId =
      body.clinic_id !== undefined && body.clinic_id !== null && body.clinic_id !== ""
        ? assertPositiveIntId(body.clinic_id, "clinic_id")
        : null;
    const bookingId =
      body.booking_id !== undefined && body.booking_id !== null && body.booking_id !== ""
        ? assertPositiveIntId(body.booking_id, "booking_id")
        : null;

    if (bookingId) {
      const b = await getBookingForPatient(bookingId, patientUserId);
      if (!b) throw new AppError(404, "Захиалга олдсонгүй.");
      if (clinicId == null) clinicId = Number(b.clinic_id);
      else if (Number(b.clinic_id) !== clinicId) {
        throw new AppError(400, "Захиалга сонгосон эмнэлэгтэй таарахгүй байна.");
      }
    } else if (clinicId) {
      await assertPatientHasBookingWithClinic(patientUserId, clinicId);
    }

    return medicalRecordsRepo.insertLabTestResult({
      patient_user_id: patientUserId,
      clinic_id: clinicId,
      doctor_id: null,
      booking_id: bookingId,
      title,
      file_placeholder: filePlaceholder,
      notes,
      source: LAB_RESULT_SOURCE.CUSTOMER_UPLOADED,
      created_by_user_id: user.id,
    });
  }

  throw new AppError(403, "Шинжилгээний бүртгэл үүсгэх эрхгүй.");
}

async function listLabResultsForPatientQuery(providerUserId, query) {
  const patientUserId = assertPositiveIntId(query.patient_user_id, "patient_user_id");
  await assertPatientVisibleToProvider(patientUserId, providerUserId);
  if (query.clinic_id) {
    await assertClinicOwnedByProvider(assertPositiveIntId(query.clinic_id, "clinic_id"), providerUserId);
  }
  return medicalRecordsRepo.listLabResultsForPatient(patientUserId, providerUserId, {
    clinic_id: query.clinic_id,
    doctor_id: query.doctor_id,
    booking_id: query.booking_id,
  });
}

async function listMyLabResults(customerUserId) {
  return medicalRecordsRepo.listLabResultsForCustomer(customerUserId);
}

module.exports = {
  createMedicalNote,
  listMedicalNotesForPatientQuery,
  listMyMedicalNotes,
  createPrescription,
  listPrescriptionsForPatientQuery,
  listMyPrescriptions,
  createLabTestResult,
  listLabResultsForPatientQuery,
  listMyLabResults,
};
