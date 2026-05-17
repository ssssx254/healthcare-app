const jwt = require("jsonwebtoken");
const { env } = require("../config/env");

function signAccessToken(user) {
  return jwt.sign(
    {
      sub: String(user.id),
      role: user.role,
      email: user.email,
      onboarding_status: user.onboarding_status,
      token_type: "access",
    },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn },
  );
}

function signResetToken(userId) {
  return jwt.sign(
    {
      sub: String(userId),
      token_type: "password_reset",
    },
    env.jwt.secret,
    { expiresIn: "15m" },
  );
}

function verifyToken(token) {
  return jwt.verify(token, env.jwt.secret);
}

module.exports = {
  signAccessToken,
  signResetToken,
  verifyToken,
};

