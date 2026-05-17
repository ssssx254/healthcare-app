const { AppError } = require("../utils/appError");
const { isValidRole, ROLES } = require("../constants/roles");

function asTrimmedString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function validateRegisterBody(body) {
  const full_name = asTrimmedString(body.full_name);
  const email = asTrimmedString(body.email);
  const password = typeof body.password === "string" ? body.password : "";
  const role = asTrimmedString(body.role) || ROLES.CUSTOMER;
  const phone = body.phone == null ? null : asTrimmedString(body.phone);

  if (!full_name) throw new AppError(400, "Овог нэр оруулна уу.");
  if (!email) throw new AppError(400, "Имэйл оруулна уу.");
  if (!password) throw new AppError(400, "Нууц үг оруулна уу.");
  if (!isValidRole(role)) throw new AppError(400, "Хэрэглэгчийн төрөл буруу байна.");

  return { full_name, email, password, role, phone };
}

function validateLoginBody(body) {
  const identifier = asTrimmedString(body.identifier || body.email);
  const password = typeof body.password === "string" ? body.password : "";
  if (!identifier) throw new AppError(400, "Имэйл эсвэл утасны дугаар оруулна уу.");
  if (!password) throw new AppError(400, "Нууц үг оруулна уу.");
  return { identifier, password };
}

function validateForgotPasswordBody(body) {
  const identifier = asTrimmedString(body.identifier);
  if (!identifier) throw new AppError(400, "Имэйл эсвэл утасны дугаар оруулна уу.");
  return { identifier };
}

function validateResetPasswordBody(body) {
  const token = asTrimmedString(body.token);
  const new_password = typeof body.new_password === "string" ? body.new_password : "";
  if (!token) throw new AppError(400, "Сэргээх токен оруулна уу.");
  if (!new_password) throw new AppError(400, "Шинэ нууц үг оруулна уу.");
  return { token, new_password };
}

module.exports = {
  validateRegisterBody,
  validateLoginBody,
  validateForgotPasswordBody,
  validateResetPasswordBody,
};

