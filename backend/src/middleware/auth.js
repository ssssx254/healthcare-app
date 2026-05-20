const { AppError } = require("../utils/appError");
const { verifyToken } = require("../utils/token");
const { ROLES } = require("../constants/roles");
const authRepo = require("../repositories/auth.repository");

/**
 * `Authorization: Bearer <token>` уншиж `req.user` тохируулна.
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next(new AppError(401, "Нэвтэрсэн эрх шаардлагатай."));
  }
  const token = header.slice(7).trim();
  if (!token) {
    return next(new AppError(401, "Токен олдсонгүй."));
  }
  try {
    const payload = verifyToken(token);
    req.user = {
      id: Number(payload.sub),
      role: payload.role,
      email: payload.email,
      onboarding_status: payload.onboarding_status,
    };
    return next();
  } catch {
    return next(new AppError(401, "Токен хүчингүй эсвэл хугацаа дууссан."));
  }
}

/** Bearer байвал `req.user` тохируулна; байхгүй бол алгасна. */
function attachUserIfAuthenticated(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next();
  }
  const token = header.slice(7).trim();
  if (!token) {
    return next();
  }
  try {
    const payload = verifyToken(token);
    req.user = {
      id: Number(payload.sub),
      role: payload.role,
      email: payload.email,
      onboarding_status: payload.onboarding_status,
    };
  } catch {
    /* public endpoint — токен буруу бол viewer мэдээлэлгүй */
  }
  return next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError(401, "Нэвтэрсэн эрх шаардлагатай."));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, "Энэ үйлдлийг хийх эрхгүй."));
    }
    return next();
  };
}

async function requireApprovedProvider(req, res, next) {
  if (!req.user) {
    return next(new AppError(401, "Нэвтэрсэн эрх шаардлагатай."));
  }
  if (req.user.role !== ROLES.PROVIDER) {
    return next(new AppError(403, "Энэ үйлдлийг хийх эрхгүй."));
  }

  try {
    const latestUser = await authRepo.findUserById(req.user.id);
    if (!latestUser) {
      return next(new AppError(401, "Хэрэглэгч олдсонгүй."));
    }
    if (latestUser.onboarding_status !== "approved") {
      return next(new AppError(403, "Таны үйлчилгээ үзүүлэгч бүртгэл баталгаажаагүй байна."));
    }
  } catch (err) {
    return next(err);
  }

  return next();
}

module.exports = { requireAuth, attachUserIfAuthenticated, requireRole, requireApprovedProvider };
