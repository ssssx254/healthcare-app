const { AppError } = require("../utils/appError");
const { assertPositiveIntId, optionalTrimmedString } = require("../utils/validation");
const { ROLES } = require("../constants/roles");
const { isCardBrand } = require("../constants/paymentMethods");
const paymentMethodsRepo = require("../repositories/paymentMethods.repository");

function assertCustomer(user) {
  if (!user || user.role !== ROLES.CUSTOMER) {
    throw new AppError(403, "Зөвхөн үйлчлүүлэгч энэ үйлдлийг хийнэ.");
  }
}

function parseLast4(raw) {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (digits.length !== 4) {
    throw new AppError(400, "Картын сүүлийн 4 орон оруулна уу.");
  }
  return digits;
}

function parseExpiry(monthRaw, yearRaw) {
  const month = Number(monthRaw);
  const year = Number(yearRaw);
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new AppError(400, "Дуусах сар 1–12 байна.");
  }
  const fullYear = year < 100 ? 2000 + year : year;
  if (!Number.isInteger(fullYear) || fullYear < new Date().getFullYear()) {
    throw new AppError(400, "Картын хугацаа дууссан эсвэл буруу байна.");
  }
  const now = new Date();
  if (fullYear === now.getFullYear() && month < now.getMonth() + 1) {
    throw new AppError(400, "Картын хугацаа дууссан байна.");
  }
  return { expiry_month: month, expiry_year: fullYear };
}

async function listMyPaymentMethods(user) {
  assertCustomer(user);
  return paymentMethodsRepo.listByUser(user.id);
}

async function createPaymentMethod(user, body) {
  assertCustomer(user);
  const card_holder_name = optionalTrimmedString(body.card_holder_name, 191);
  if (!card_holder_name) throw new AppError(400, "Карт эзэмшигчийн нэр оруулна уу.");
  const card_brand = String(body.card_brand || "").trim().toLowerCase();
  if (!isCardBrand(card_brand)) throw new AppError(400, "Картын төрөл: visa эсвэл mastercard.");
  const card_last4 = parseLast4(body.card_last4);
  const { expiry_month, expiry_year } = parseExpiry(body.expiry_month, body.expiry_year);
  const count = await paymentMethodsRepo.countByUser(user.id);
  const is_default = body.is_default === true || body.is_default === 1 || count === 0;

  return paymentMethodsRepo.insert({
    user_id: user.id,
    card_brand,
    card_last4,
    card_holder_name,
    expiry_month,
    expiry_year,
    is_default,
  });
}

async function setDefaultPaymentMethod(user, id) {
  assertCustomer(user);
  const pmId = assertPositiveIntId(id, "id");
  const row = await paymentMethodsRepo.setDefault(pmId, user.id);
  if (!row) throw new AppError(404, "Карт олдсонгүй.");
  return row;
}

async function deletePaymentMethod(user, id) {
  assertCustomer(user);
  const pmId = assertPositiveIntId(id, "id");
  const ok = await paymentMethodsRepo.remove(pmId, user.id);
  if (!ok) throw new AppError(404, "Карт олдсонгүй.");
  const remaining = await paymentMethodsRepo.listByUser(user.id);
  if (remaining.length > 0 && !remaining.some((r) => r.is_default === 1)) {
    await paymentMethodsRepo.setDefault(remaining[0].id, user.id);
  }
  return { deleted: true };
}

module.exports = {
  listMyPaymentMethods,
  createPaymentMethod,
  setDefaultPaymentMethod,
  deletePaymentMethod,
};
