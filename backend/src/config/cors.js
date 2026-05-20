const { env } = require("./env");

/**
 * CORS — production-д Firebase Hosting домэйн зөвшөөрнө.
 * Development-д бүх origin (Expo web, LAN) зөвшөөрнө.
 */
function buildCorsOptions() {
  if (env.nodeEnv !== "production") {
    return {
      origin: true,
      credentials: true,
    };
  }

  const allowed = new Set(env.corsOrigins);

  return {
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (allowed.has(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  };
}

module.exports = { buildCorsOptions };
