const { AppError } = require("../utils/appError");

function validatePushTokenBody(body) {
  const expo_push_token = String(body?.expo_push_token || "").trim();
  if (!expo_push_token) {
    throw new AppError(400, "expo_push_token оруулна уу.");
  }
  if (expo_push_token.length < 8 || expo_push_token.length > 255) {
    throw new AppError(400, "expo_push_token урт буруу байна.");
  }
  const platformRaw = body?.platform == null ? "expo" : String(body.platform).trim().toLowerCase();
  const platform = platformRaw || "expo";
  if (!["expo", "ios", "android"].includes(platform)) {
    throw new AppError(400, "platform буруу байна.");
  }
  return { expo_push_token, platform };
}

module.exports = { validatePushTokenBody };

