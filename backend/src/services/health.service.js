const { pingDatabase, logDatabaseConnectionError } = require("../config/database");
const { env } = require("../config/env");

/**
 * Health check: app + DB (SELECT 1 амжилттай л "connected").
 */
async function getHealthStatus() {
  let database = "disconnected";

  try {
    const ok = await pingDatabase();
    database = ok ? "connected" : "disconnected";
    if (!ok && env.nodeEnv === "production") {
      console.error("[health] MySQL SELECT 1 did not return expected row");
    }
  } catch (err) {
    database = "disconnected";
    if (env.nodeEnv === "production") {
      logDatabaseConnectionError(err, "health");
    } else {
      console.warn("[health] database ping failed:", sanitizeDevMessage(err));
    }
  }

  return {
    status: "ok",
    timestamp: new Date().toISOString(),
    database,
  };
}

function sanitizeDevMessage(err) {
  const message = err?.message ? String(err.message) : String(err);
  return message.replace(/:\/\/([^:@/]+):([^@/]+)@/g, "://$1:***@");
}

module.exports = { getHealthStatus };
