const authService = require("../services/auth.service");
const { ok } = require("../utils/apiResponse");
const { asyncHandler } = require("../utils/asyncHandler");

const register = asyncHandler(async (req, res) => {
  const { full_name, email, password, role, phone } = req.body;
  const result = await authService.register({ full_name, email, password, role, phone });
  return ok(res, result, "Бүртгэл амжилттай");
});

const login = asyncHandler(async (req, res) => {
  const { identifier, email, password } = req.body;
  const result = await authService.login({ identifier: identifier ?? email, password });
  return ok(res, result, "Нэвтэрлээ");
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { identifier } = req.body;
  const result = await authService.forgotPassword({ identifier });
  return ok(res, result, "Сэргээх хүсэлт боловсруулагдлаа");
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, new_password } = req.body;
  const result = await authService.resetPassword({ token, new_password });
  return ok(res, result, "Нууц үг шинэчлэгдлээ");
});

const me = asyncHandler(async (req, res) => {
  const profile = await authService.getCurrentUserProfile(req.user.id);
  return ok(res, profile, "Профайл мэдээлэл");
});

module.exports = { register, login, forgotPassword, resetPassword, me };
