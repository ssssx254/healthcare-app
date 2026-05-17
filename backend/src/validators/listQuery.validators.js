const { AppError } = require("../utils/appError");
const { assertPositiveIntId } = require("../utils/validation");
const { parsePagination, parseSort, optionalDateString, optionalTrimmedQueryString } = require("../utils/listQuery");

const BOOKING_STATUSES = new Set(["pending", "confirmed", "cancelled", "completed"]);
const PAYMENT_STATUSES = new Set(["unpaid", "paid", "refunded"]);
const BOOKING_SORT_FIELDS = ["created_at"];

/** @param {Record<string, unknown>} q */
function validateBookingsListQuery(q) {
  const { page, pageSize, offset } = parsePagination(q);
  const { sortBy, sortDir } = parseSort(q, BOOKING_SORT_FIELDS, "created_at", "desc");
  let status;
  if (q.status !== undefined && q.status !== null && String(q.status).trim() !== "") {
    status = String(q.status).trim().toLowerCase();
    if (!BOOKING_STATUSES.has(status)) throw new AppError(400, "Захиалгын төлөв буруу байна.");
  }
  let payment_status;
  if (q.payment_status !== undefined && q.payment_status !== null && String(q.payment_status).trim() !== "") {
    payment_status = String(q.payment_status).trim().toLowerCase();
    if (!PAYMENT_STATUSES.has(payment_status)) throw new AppError(400, "Төлбөрийн төлөв буруу байна.");
  }
  let clinic_id;
  if (q.clinic_id !== undefined && q.clinic_id !== null && String(q.clinic_id).trim() !== "") {
    clinic_id = assertPositiveIntId(q.clinic_id, "clinic_id");
  }
  let doctor_id;
  if (q.doctor_id !== undefined && q.doctor_id !== null && String(q.doctor_id).trim() !== "") {
    doctor_id = assertPositiveIntId(q.doctor_id, "doctor_id");
  }
  const from_date = optionalDateString(q.from_date, "from_date");
  const to_date = optionalDateString(q.to_date, "to_date");
  return {
    page,
    pageSize,
    offset,
    sortBy,
    sortDir,
    status,
    payment_status,
    clinic_id,
    doctor_id,
    from_date,
    to_date,
  };
}

const CONSULTATION_STATUSES = new Set(["pending", "accepted", "closed", "cancelled"]);
const CONSULTATION_SORT = ["created_at"];

function validateConsultationsListQuery(q) {
  const { page, pageSize, offset } = parsePagination(q);
  const { sortBy, sortDir } = parseSort(q, CONSULTATION_SORT, "created_at", "desc");
  let status;
  if (q.status !== undefined && q.status !== null && String(q.status).trim() !== "") {
    status = String(q.status).trim().toLowerCase();
    if (!CONSULTATION_STATUSES.has(status)) throw new AppError(400, "Төлөв буруу байна.");
  }
  let clinic_id;
  if (q.clinic_id !== undefined && q.clinic_id !== null && String(q.clinic_id).trim() !== "") {
    clinic_id = assertPositiveIntId(q.clinic_id, "clinic_id");
  }
  let doctor_id;
  if (q.doctor_id !== undefined && q.doctor_id !== null && String(q.doctor_id).trim() !== "") {
    doctor_id = assertPositiveIntId(q.doctor_id, "doctor_id");
  }
  const from_date = optionalDateString(q.from_date, "from_date");
  const to_date = optionalDateString(q.to_date, "to_date");
  return { page, pageSize, offset, sortBy, sortDir, status, clinic_id, doctor_id, from_date, to_date };
}

const CLINIC_APPROVAL = new Set(["pending", "approved", "rejected"]);
const CLINIC_SORT = ["created_at", "clinic_name"];

function validatePublicClinicsListQuery(q) {
  const { page, pageSize, offset } = parsePagination(q);
  const { sortBy, sortDir } = parseSort(q, CLINIC_SORT, "created_at", "desc");
  const city = optionalTrimmedQueryString(q.city, 128, "city");
  const clinic_type = optionalTrimmedQueryString(q.clinic_type, 128, "clinic_type");
  const qSearch = optionalTrimmedQueryString(q.q, 120, "q");
  return { page, pageSize, offset, sortBy, sortDir, city, clinic_type, q: qSearch };
}

const DOCTOR_SORT = ["created_at", "full_name", "specialization"];

function validateDoctorsListQuery(q) {
  const { page, pageSize, offset } = parsePagination(q);
  const { sortBy, sortDir } = parseSort(q, DOCTOR_SORT, "created_at", "desc");
  let clinic_id;
  if (q.clinic_id !== undefined && q.clinic_id !== null && String(q.clinic_id).trim() !== "") {
    clinic_id = assertPositiveIntId(q.clinic_id, "clinic_id");
  }
  const specialty = optionalTrimmedQueryString(q.specialty, 120, "specialty");
  return { page, pageSize, offset, sortBy, sortDir, clinic_id, specialty };
}

const WALLET_TX_TYPES = new Set(["top_up", "booking_payment", "booking_refund", "admin_adjustment"]);

function validateWalletTransactionsQuery(q) {
  const { page, pageSize, offset } = parsePagination(q, { defaultPageSize: 20, maxPageSize: 100 });
  let transaction_type;
  if (q.transaction_type !== undefined && q.transaction_type !== null && String(q.transaction_type).trim() !== "") {
    transaction_type = String(q.transaction_type).trim();
    if (!WALLET_TX_TYPES.has(transaction_type)) throw new AppError(400, "Гүйлгээний төрөл буруу байна.");
  }
  return { page, pageSize, offset, transaction_type };
}

const ADMIN_CLINIC_SORT = ["created_at", "clinic_name", "approval_status"];

function validateAdminClinicsListQuery(q) {
  const { page, pageSize, offset } = parsePagination(q);
  const { sortBy, sortDir } = parseSort(q, ADMIN_CLINIC_SORT, "created_at", "desc");
  let approval_status;
  if (q.approval_status !== undefined && q.approval_status !== null && String(q.approval_status).trim() !== "") {
    approval_status = String(q.approval_status).trim().toLowerCase();
    if (!CLINIC_APPROVAL.has(approval_status)) throw new AppError(400, "approval_status буруу байна.");
  }
  const city = optionalTrimmedQueryString(q.city, 128, "city");
  const clinic_type = optionalTrimmedQueryString(q.clinic_type, 128, "clinic_type");
  return { page, pageSize, offset, sortBy, sortDir, approval_status, city, clinic_type };
}

const ADMIN_DOCTOR_SORT = ["created_at", "full_name", "specialization"];

function validateAdminDoctorsListQuery(q) {
  const { page, pageSize, offset } = parsePagination(q);
  const { sortBy, sortDir } = parseSort(q, ADMIN_DOCTOR_SORT, "created_at", "desc");
  let clinic_id;
  if (q.clinic_id !== undefined && q.clinic_id !== null && String(q.clinic_id).trim() !== "") {
    clinic_id = assertPositiveIntId(q.clinic_id, "clinic_id");
  }
  const specialty = optionalTrimmedQueryString(q.specialty, 120, "specialty");
  return { page, pageSize, offset, sortBy, sortDir, clinic_id, specialty };
}

const USER_ROLES = new Set(["customer", "provider", "system_admin"]);
const USER_SORT = ["created_at", "full_name", "email"];

function validateAdminUsersListQuery(q) {
  const { page, pageSize, offset } = parsePagination(q);
  const { sortBy, sortDir } = parseSort(q, USER_SORT, "created_at", "desc");
  let role;
  if (q.role !== undefined && q.role !== null && String(q.role).trim() !== "") {
    role = String(q.role).trim().toLowerCase();
    if (!USER_ROLES.has(role)) throw new AppError(400, "role буруу байна.");
  }
  const qSearch = optionalTrimmedQueryString(q.q, 120, "q");
  return { page, pageSize, offset, sortBy, sortDir, role, q: qSearch };
}

const REPORT_STATUSES = new Set(["open", "reviewing", "resolved", "dismissed"]);

function validateAdminContentReportsListQuery(q) {
  const { page, pageSize, offset } = parsePagination(q);
  let status;
  if (q.status !== undefined && q.status !== null && String(q.status).trim() !== "") {
    status = String(q.status).trim().toLowerCase();
    if (!REPORT_STATUSES.has(status)) throw new AppError(400, "Төлөв буруу байна.");
  }
  return { page, pageSize, offset, status };
}

const SERVICE_SORT = ["created_at", "service_name"];

function validateServicesListQuery(q) {
  const { page, pageSize, offset } = parsePagination(q);
  const { sortBy, sortDir } = parseSort(q, SERVICE_SORT, "created_at", "desc");
  let clinic_id;
  if (q.clinic_id !== undefined && q.clinic_id !== null && String(q.clinic_id).trim() !== "") {
    clinic_id = assertPositiveIntId(q.clinic_id, "clinic_id");
  }
  let doctor_id;
  if (q.doctor_id !== undefined && q.doctor_id !== null && String(q.doctor_id).trim() !== "") {
    doctor_id = assertPositiveIntId(q.doctor_id, "doctor_id");
  }
  return { page, pageSize, offset, sortBy, sortDir, clinic_id, doctor_id };
}

const SLOT_SORT = ["slot_date"];

function validateScheduleSlotsListQuery(q) {
  const { page, pageSize, offset } = parsePagination(q);
  const { sortBy, sortDir } = parseSort(q, SLOT_SORT, "slot_date", "asc");
  let doctor_id;
  if (q.doctor_id !== undefined && q.doctor_id !== null && String(q.doctor_id).trim() !== "") {
    doctor_id = assertPositiveIntId(q.doctor_id, "doctor_id");
  }
  const from_date = optionalDateString(q.from_date, "from_date");
  const to_date = optionalDateString(q.to_date, "to_date");
  return { page, pageSize, offset, sortBy, sortDir, doctor_id, from_date, to_date };
}

function validateScheduleSlotsAvailableListQuery(q) {
  const { page, pageSize, offset } = parsePagination(q, { defaultPageSize: 50, maxPageSize: 200 });
  const doctor_id = assertPositiveIntId(q.doctor_id, "doctor_id");
  let service_id;
  if (q.service_id !== undefined && q.service_id !== null && String(q.service_id).trim() !== "") {
    service_id = assertPositiveIntId(q.service_id, "service_id");
  }
  const from_date = optionalDateString(q.from_date, "from_date");
  const to_date = optionalDateString(q.to_date, "to_date");
  return { page, pageSize, offset, doctor_id, service_id, from_date, to_date };
}

function validateNotificationsListQuery(q) {
  const { page, pageSize, offset } = parsePagination(q);
  let is_read;
  if (q.is_read !== undefined && q.is_read !== null && String(q.is_read).trim() !== "") {
    const v = String(q.is_read).trim().toLowerCase();
    if (v === "true" || v === "1") is_read = "1";
    else if (v === "false" || v === "0") is_read = "0";
    else throw new AppError(400, "is_read нь 0, 1, true, false байна.");
  }
  const type = optionalTrimmedQueryString(q.type, 64, "type");
  return { page, pageSize, offset, is_read, type };
}

module.exports = {
  validateBookingsListQuery,
  validateConsultationsListQuery,
  validatePublicClinicsListQuery,
  validateDoctorsListQuery,
  validateWalletTransactionsQuery,
  validateAdminClinicsListQuery,
  validateAdminDoctorsListQuery,
  validateAdminUsersListQuery,
  validateAdminContentReportsListQuery,
  validateServicesListQuery,
  validateScheduleSlotsListQuery,
  validateScheduleSlotsAvailableListQuery,
  validateNotificationsListQuery,
};
