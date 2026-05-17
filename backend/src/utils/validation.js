const { AppError } = require("./appError");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function assertEmail(email, fieldName = "Имэйл") {
  if (!isNonEmptyString(email)) {
    throw new AppError(400, `${fieldName} оруулна уу.`);
  }
  const e = email.trim().toLowerCase();
  if (e.length > 191 || !EMAIL_RE.test(e)) {
    throw new AppError(400, `${fieldName} хаяг буруу байна.`);
  }
  return e;
}

function assertPasswordForRegister(password) {
  if (!isNonEmptyString(password)) {
    throw new AppError(400, "Нууц үг оруулна уу.");
  }
  if (password.length < 4) {
    throw new AppError(400, "Нууц үг хамгийн багадаа 4 тэмдэгт байна.");
  }
  if (password.length > 72) {
    throw new AppError(400, "Нууц үг хэт урт байна (хамгийн ихдээ 72 тэмдэгт).");
  }
  return password;
}

function assertPasswordForLogin(password) {
  if (password === undefined || password === null || String(password).length === 0) {
    throw new AppError(400, "Нууц үг оруулна уу.");
  }
  const pwd = String(password);
  if (pwd.length < 4) {
    throw new AppError(400, "Нууц үг хамгийн багадаа 4 тэмдэгт байна.");
  }
  if (pwd.length > 128) {
    throw new AppError(400, "Нууц үг буруу байна.");
  }
  return pwd;
}

function assertPositiveIntId(value, fieldName) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw new AppError(400, `${fieldName} зөв эерэг тоо байх ёстой.`);
  }
  return n;
}

function optionalTrimmedString(v, maxLen) {
  if (v === undefined || v === null) return null;
  if (typeof v !== "string") {
    throw new AppError(400, "Текст талбар буруу төрөлтэй байна.");
  }
  const t = v.trim();
  if (!t) return null;
  if (t.length > maxLen) {
    throw new AppError(400, `Талбарын урт ${maxLen}-аас хэтэрсэн байна.`);
  }
  return t;
}

/** HTTP/HTTPS URL — уулзалтын холбоос */
function assertOptionalMeetingUrl(url) {
  if (url === undefined || url === null || url === "") {
    return null;
  }
  if (typeof url !== "string") {
    throw new AppError(400, "meeting_link текст байх ёстой.");
  }
  const u = url.trim();
  if (u.length > 1024) {
    throw new AppError(400, "Холбоос хэт урт байна.");
  }
  if (!/^https?:\/\//i.test(u)) {
    throw new AppError(400, "Холбоос http:// эсвэл https://-ээр эхлэх ёстой.");
  }
  return u;
}

module.exports = {
  EMAIL_RE,
  isNonEmptyString,
  assertEmail,
  assertPasswordForRegister,
  assertPasswordForLogin,
  assertPositiveIntId,
  optionalTrimmedString,
  assertOptionalMeetingUrl,
};
