const { AppError } = require("../utils/appError");
const { assertPositiveIntId, optionalTrimmedString } = require("../utils/validation");
const { isCardBrand } = require("../constants/paymentMethods");

function validateCreatePaymentMethodBody(body) {
  const card_holder_name = optionalTrimmedString(body.card_holder_name, 191);
  if (!card_holder_name) throw new AppError(400, "Карт эзэмшигчийн нэр оруулна уу.");
  const card_brand = String(body.card_brand || "").trim().toLowerCase();
  if (!isCardBrand(card_brand)) throw new AppError(400, "Картын төрөл: visa эсвэл mastercard.");
  const digits = String(body.card_last4 ?? "").replace(/\D/g, "");
  if (digits.length !== 4) throw new AppError(400, "Картын сүүлийн 4 орон оруулна уу.");
  const expiry_month = Number(body.expiry_month);
  const expiry_year = Number(body.expiry_year);
  if (!Number.isInteger(expiry_month) || expiry_month < 1 || expiry_month > 12) {
    throw new AppError(400, "Дуусах сар 1–12 байна.");
  }
  return {
    card_holder_name,
    card_brand,
    card_last4: digits,
    expiry_month,
    expiry_year,
    is_default: body.is_default === true || body.is_default === 1,
  };
}

function validateIdParam(params) {
  return { id: assertPositiveIntId(params.id, "id") };
}

module.exports = {
  validateCreatePaymentMethodBody,
  validateIdParam,
};
