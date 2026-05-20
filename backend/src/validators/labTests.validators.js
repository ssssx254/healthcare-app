const { AppError } = require("../utils/appError");
const { assertPositiveIntId } = require("../utils/validation");

function validateCustomerListQuery(query) {
  const filter = String(query.filter || "all").trim();
  if (!["all", "mine", "clinic"].includes(filter)) {
    throw new AppError(400, "filter нь all, mine, clinic байна.");
  }
  return { filter };
}

function validateProviderListQuery(query) {
  const out = {};
  if (query.patient_user_id != null && query.patient_user_id !== "") {
    out.patient_user_id = assertPositiveIntId(query.patient_user_id, "patient_user_id");
  }
  if (query.clinic_id != null && query.clinic_id !== "") {
    out.clinic_id = assertPositiveIntId(query.clinic_id, "clinic_id");
  }
  if (query.doctor_id != null && query.doctor_id !== "") {
    out.doctor_id = assertPositiveIntId(query.doctor_id, "doctor_id");
  }
  return out;
}

function validateCreateCustomerBody(body) {
  return body;
}

function validateUpdateProviderBody(body) {
  return body;
}

function validateCreateProviderBody(body) {
  return body;
}

module.exports = {
  validateCustomerListQuery,
  validateProviderListQuery,
  validateCreateCustomerBody,
  validateUpdateProviderBody,
  validateCreateProviderBody,
};
