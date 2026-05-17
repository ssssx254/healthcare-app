const bcrypt = require("bcryptjs");
const { AppError } = require("../utils/appError");
const { assertEmail, assertPasswordForRegister, assertPasswordForLogin } = require("../utils/validation");
const { isValidRole } = require("../constants/roles");
const { signAccessToken, signResetToken, verifyToken } = require("../utils/token");
const authRepo = require("../repositories/auth.repository");

const SALT_ROUNDS = 10;

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    role: row.role,
    onboarding_status: row.onboarding_status || (row.role === "provider" ? "pending" : "approved"),
    phone: row.phone,
    created_at: row.created_at,
  };
}

function assertFullName(full_name) {
  if (typeof full_name !== "string" || full_name.trim().length < 2) {
    throw new AppError(400, "Бүтэн нэр хамгийн багадаа 2 тэмдэгт байна.");
  }
  const t = full_name.trim();
  if (t.length > 120) {
    throw new AppError(400, "Бүтэн нэр хэт урт байна.");
  }
  return t;
}

function normalizeOptionalPhone(phone) {
  if (phone === undefined || phone === null || phone === "") {
    return null;
  }
  if (typeof phone !== "string") {
    throw new AppError(400, "Утасны дугаар буруу байна.");
  }
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) {
    throw new AppError(400, "Утасны дугаар 8–15 оронтой байна.");
  }
  return phone.trim().slice(0, 32);
}

async function findUserByIdentifier(identifier) {
  const normalizedIdentifier = String(identifier ?? "").trim();
  if (!normalizedIdentifier) {
    throw new AppError(400, "Имэйл эсвэл утасны дугаар оруулна уу.");
  }
  if (normalizedIdentifier.includes("@")) {
    const emailNorm = assertEmail(normalizedIdentifier);
    return authRepo.findUserAuthByEmail(emailNorm);
  }
  const rawPhone = normalizedIdentifier.slice(0, 32);
  const digits = normalizedIdentifier.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) {
    throw new AppError(400, "Имэйл эсвэл утасны дугаар буруу байна.");
  }
  return authRepo.findUserAuthByPhone(rawPhone, digits);
}

async function register({ full_name, email, password, role = "customer", phone = null }) {
  const name = assertFullName(full_name);
  const emailNorm = assertEmail(email);
  const pwd = assertPasswordForRegister(password);
  if (!isValidRole(role)) {
    throw new AppError(400, "Хэрэглэгчийн төрөл буруу байна.");
  }
  const phoneNorm = normalizeOptionalPhone(phone);
  const onboardingStatus = role === "provider" ? "pending" : "approved";
  const password_hash = await bcrypt.hash(pwd, SALT_ROUNDS);

  try {
    const userId = await authRepo.createUser({
      full_name: name,
      email: emailNorm,
      password_hash,
      role,
      onboarding_status: onboardingStatus,
      phone: phoneNorm,
    });
    const userRow = await authRepo.findUserById(userId);
    const token = signAccessToken(userRow);
    const user = mapUser(userRow);
    return { user, token, role: user.role };
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      throw new AppError(409, "Энэ имэйлээр бүртгэл аль хэдийн байна.");
    }
    throw err;
  }
}

async function login({ identifier, password }) {
  const row = await findUserByIdentifier(identifier);
  const pwd = assertPasswordForLogin(password);
  if (!row) {
    throw new AppError(401, "Имэйл эсвэл нууц үг буруу байна.");
  }
  const match = await bcrypt.compare(pwd, row.password_hash);
  if (!match) {
    throw new AppError(401, "Имэйл эсвэл нууц үг буруу байна.");
  }
  const user = mapUser(row);
  const token = signAccessToken(row);
  return { user, token, role: user.role };
}

async function forgotPassword({ identifier }) {
  const row = await findUserByIdentifier(identifier);
  if (!row) {
    return { success: true, message: "Хэрэв бүртгэлтэй бол сэргээх заавар илгээгдлээ." };
  }
  const reset_token = signResetToken(row.id);
  return {
    success: true,
    message: "Сэргээх заавар бэлэн боллоо.",
    reset_token,
  };
}

async function resetPassword({ token, new_password }) {
  const rawToken = String(token ?? "").trim();
  const pwd = assertPasswordForRegister(new_password);
  if (!rawToken) {
    throw new AppError(400, "Сэргээх токен дутуу байна.");
  }
  let payload;
  try {
    payload = verifyToken(rawToken);
  } catch {
    throw new AppError(400, "Сэргээх токен хүчингүй эсвэл хугацаа дууссан.");
  }
  if (payload.token_type !== "password_reset") {
    throw new AppError(400, "Сэргээх токен буруу байна.");
  }
  const userId = Number(payload.sub);
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new AppError(400, "Сэргээх токен буруу байна.");
  }
  const password_hash = await bcrypt.hash(pwd, SALT_ROUNDS);
  await authRepo.updateUserPassword(userId, password_hash);
  return { success: true, message: "Нууц үг амжилттай шинэчлэгдлээ." };
}

async function getCurrentUserProfile(userId) {
  const row = await authRepo.findUserById(userId);
  if (!row) {
    throw new AppError(404, "Хэрэглэгч олдсонгүй.");
  }
  return mapUser(row);
}

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  getCurrentUserProfile,
  mapUser,
};
