const { pool } = require("../config/database");
const { AppError } = require("../utils/appError");
const { assertPositiveIntId, optionalTrimmedString } = require("../utils/validation");
const {
  LAB_TEST_STATUS,
  LAB_UPLOADED_BY,
  isLabTestStatus,
  isLabUploadedBy,
  isLabFileType,
} = require("../constants/labTests");
const labTestsRepo = require("../repositories/labTests.repository");
const bookingLabTestsRepo = require("../repositories/bookingLabTests.repository");

const MAX_FILE_DATA_URL = 2_500_000;

function assertTitle(v) {
  const t = optionalTrimmedString(v, 255);
  if (!t) throw new AppError(400, "Гарчиг оруулна уу.");
  return t;
}

function assertTestType(v) {
  const t = optionalTrimmedString(v, 128);
  if (!t) throw new AppError(400, "Шинжилгээний төрөл оруулна уу.");
  return t;
}

function assertTestDate(v) {
  const raw = String(v ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    throw new AppError(400, "Огноо YYYY-MM-DD форматаар оруулна уу.");
  }
  return raw;
}

function normalizeFileField(url, type, label) {
  if (url === undefined || url === null || url === "") {
    return { url: null, type: type === "none" ? "none" : null };
  }
  const u = String(url).trim();
  if (u.length > MAX_FILE_DATA_URL) {
    throw new AppError(400, `${label} хэт том байна. Жижиг файл сонгоно уу.`);
  }
  const t = String(type || "").trim().toLowerCase();
  if (u.startsWith("data:image/")) {
    if (!isLabFileType("image") && t !== "image") {
      return { url: u, type: "image" };
    }
    return { url: u, type: "image" };
  }
  if (u.startsWith("data:application/pdf") || t === "pdf") {
    return { url: u, type: "pdf" };
  }
  if (u.startsWith("http://") || u.startsWith("https://")) {
    return { url: u, type: isLabFileType(t) ? t : "none" };
  }
  throw new AppError(400, `${label} буруу форматтай байна.`);
}

async function assertPatientHasBookingWithProvider(patientUserId, providerUserId) {
  const [rows] = await pool.execute(
    `SELECT b.id FROM bookings b
     INNER JOIN clinics c ON c.id = b.clinic_id
     WHERE b.patient_user_id = ? AND c.owner_user_id = ?
     LIMIT 1`,
    [patientUserId, providerUserId],
  );
  if (!rows[0]) {
    throw new AppError(403, "Энэ өвчтөний мэдээллийг харах эрхгүй.");
  }
}

async function assertProviderCanViewLabTest(labTestId, providerUserId) {
  const row = await labTestsRepo.getById(labTestId);
  if (!row) throw new AppError(404, "Шинжилгээ олдсонгүй.");

  if (row.uploaded_by === LAB_UPLOADED_BY.CLINIC) {
    if (row.clinic_id) {
      await assertClinicOwnedByProvider(row.clinic_id, providerUserId);
      await assertPatientHasBookingWithProvider(row.patient_user_id, providerUserId);
      return row;
    }
  }

  const shared = await bookingLabTestsRepo.isSharedWithProvider(labTestId, providerUserId);
  if (!shared) {
    throw new AppError(403, "Энэ шинжилгээг харах эрхгүй. Үйлчлүүлэгч эмчид хуваалаагүй байна.");
  }
  return row;
}

async function assertClinicOwnedByProvider(clinicId, providerUserId) {
  const [rows] = await pool.execute(`SELECT id FROM clinics WHERE id = ? AND owner_user_id = ? LIMIT 1`, [
    clinicId,
    providerUserId,
  ]);
  if (!rows[0]) throw new AppError(403, "Энэ эмнэлгийн эрхгүй.");
}

async function getLabTestForCustomer(id, customerUserId) {
  const row = await labTestsRepo.getById(id);
  if (!row) throw new AppError(404, "Шинжилгээ олдсонгүй.");
  if (Number(row.patient_user_id) !== Number(customerUserId)) {
    throw new AppError(403, "Энэ шинжилгээг харах эрхгүй.");
  }
  return row;
}

async function getLabTestForProvider(id, providerUserId) {
  return assertProviderCanViewLabTest(id, providerUserId);
}

async function listMyLabTests(customerUserId, query) {
  const filter = query.filter === "clinic" ? "clinic" : query.filter === "mine" ? "mine" : "all";
  return labTestsRepo.listForCustomer(customerUserId, { filter });
}

async function createCustomerLabTest(customerUserId, body) {
  const title = assertTitle(body.title);
  const test_type = assertTestType(body.test_type);
  const test_date = assertTestDate(body.test_date);
  const description = optionalTrimmedString(body.description, 4000);
  const attachment = normalizeFileField(body.attachment_url, body.attachment_type, "Хавсралт");

  let clinic_id = null;
  let booking_id = null;
  if (body.clinic_id != null && body.clinic_id !== "") {
    clinic_id = assertPositiveIntId(body.clinic_id, "clinic_id");
  }
  if (body.booking_id != null && body.booking_id !== "") {
    booking_id = assertPositiveIntId(body.booking_id, "booking_id");
    const [b] = await pool.execute(
      `SELECT clinic_id FROM bookings WHERE id = ? AND patient_user_id = ? LIMIT 1`,
      [booking_id, customerUserId],
    );
    if (!b[0]) throw new AppError(404, "Захиалга олдсонгүй.");
    if (clinic_id && Number(b[0].clinic_id) !== clinic_id) {
      throw new AppError(400, "Захиалга сонгосон эмнэлэгтэй таарахгүй байна.");
    }
    clinic_id = Number(b[0].clinic_id);
  }

  return labTestsRepo.insert({
    patient_user_id: customerUserId,
    clinic_id,
    doctor_id: null,
    booking_id,
    title,
    test_type,
    test_date,
    description,
    attachment_url: attachment.url,
    attachment_type: attachment.type,
    result_text: null,
    result_file_url: null,
    result_file_type: null,
    doctor_notes: null,
    status: LAB_TEST_STATUS.SUBMITTED,
    uploaded_by: LAB_UPLOADED_BY.CUSTOMER,
    created_by_user_id: customerUserId,
  });
}

async function listProviderLabTests(providerUserId, query) {
  const patient_user_id =
    query.patient_user_id != null && query.patient_user_id !== ""
      ? assertPositiveIntId(query.patient_user_id, "patient_user_id")
      : undefined;
  const booking_id =
    query.booking_id != null && query.booking_id !== ""
      ? assertPositiveIntId(query.booking_id, "booking_id")
      : undefined;
  const doctor_id =
    query.doctor_id != null && query.doctor_id !== ""
      ? assertPositiveIntId(query.doctor_id, "doctor_id")
      : undefined;
  if (patient_user_id) {
    await assertPatientHasBookingWithProvider(patient_user_id, providerUserId);
  }
  return labTestsRepo.listSharedForProvider(providerUserId, { patient_user_id, booking_id, doctor_id });
}

async function updateProviderLabTest(providerUserId, id, body) {
  const existing = await assertProviderCanViewLabTest(id, providerUserId);
  const fields = {};

  if (body.result_text !== undefined) {
    fields.result_text = optionalTrimmedString(body.result_text, 8000);
  }
  if (body.doctor_notes !== undefined) {
    fields.doctor_notes = optionalTrimmedString(body.doctor_notes, 8000);
  }
  if (body.result_file_url !== undefined) {
    const rf = normalizeFileField(body.result_file_url, body.result_file_type, "Үр дүнгийн файл");
    fields.result_file_url = rf.url;
    fields.result_file_type = rf.type;
  }
  if (body.status !== undefined) {
    const st = String(body.status).trim();
    if (!isLabTestStatus(st)) {
      throw new AppError(400, "Төлөв: submitted, completed, reviewed байна.");
    }
    fields.status = st;
    if (st === LAB_TEST_STATUS.COMPLETED || st === LAB_TEST_STATUS.REVIEWED) {
      fields.reviewed_by_user_id = providerUserId;
      fields.reviewed_at = new Date();
      if (!fields.uploaded_by) {
        /* keep */
      }
      if (existing.uploaded_by === LAB_UPLOADED_BY.CUSTOMER && !existing.clinic_id) {
        const [b] = await pool.execute(
          `SELECT b.clinic_id FROM bookings b
           INNER JOIN clinics c ON c.id = b.clinic_id
           WHERE b.patient_user_id = ? AND c.owner_user_id = ?
           ORDER BY b.created_at DESC LIMIT 1`,
          [existing.patient_user_id, providerUserId],
        );
        if (b[0]) fields.clinic_id = b[0].clinic_id;
      }
    }
  }

  if (Object.keys(fields).length === 0) {
    throw new AppError(400, "Шинэчлэх талбар байхгүй байна.");
  }

  return labTestsRepo.updateById(id, fields);
}

async function createProviderLabTest(providerUserId, body) {
  const patient_user_id = assertPositiveIntId(body.patient_user_id, "patient_user_id");
  const clinic_id = assertPositiveIntId(body.clinic_id, "clinic_id");
  await assertClinicOwnedByProvider(clinic_id, providerUserId);
  await assertPatientHasBookingWithProvider(patient_user_id, providerUserId);

  const title = assertTitle(body.title);
  const test_type = assertTestType(body.test_type);
  const test_date = assertTestDate(body.test_date);
  const description = optionalTrimmedString(body.description, 4000);
  const result_text = optionalTrimmedString(body.result_text, 8000);
  const doctor_notes = optionalTrimmedString(body.doctor_notes, 8000);
  const attachment = normalizeFileField(body.attachment_url, body.attachment_type, "Хавсралт");
  const resultFile = normalizeFileField(body.result_file_url, body.result_file_type, "Үр дүнгийн файл");

  let doctor_id = null;
  if (body.doctor_id != null && body.doctor_id !== "") {
    doctor_id = assertPositiveIntId(body.doctor_id, "doctor_id");
    const [d] = await pool.execute(`SELECT id FROM doctors WHERE id = ? AND clinic_id = ? LIMIT 1`, [
      doctor_id,
      clinic_id,
    ]);
    if (!d[0]) throw new AppError(400, "Эмч энэ эмнэлэгт бүртгэлгүй байна.");
  }

  const status = LAB_TEST_STATUS.REVIEWED;
  const now = new Date();

  const row = await labTestsRepo.insert({
    patient_user_id,
    clinic_id,
    doctor_id,
    booking_id: null,
    title,
    test_type,
    test_date,
    description,
    attachment_url: attachment.url,
    attachment_type: attachment.type,
    result_text,
    result_file_url: resultFile.url,
    result_file_type: resultFile.type,
    doctor_notes,
    status,
    uploaded_by: LAB_UPLOADED_BY.CLINIC,
    created_by_user_id: providerUserId,
  });

  return labTestsRepo.updateById(row.id, {
    reviewed_by_user_id: providerUserId,
    reviewed_at: now,
  });
}

module.exports = {
  listMyLabTests,
  createCustomerLabTest,
  getLabTestForCustomer,
  listProviderLabTests,
  getLabTestForProvider,
  updateProviderLabTest,
  createProviderLabTest,
};
