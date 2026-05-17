const { pingDatabase } = require("../config/database");

/**
 * Health check: app + optional DB ping.
 */
async function getHealthStatus() {
  let database = "unknown";
  try {
    await pingDatabase();
    database = "connected";
  } catch {
    database = "disconnected";
  }

  return {
    status: "ok",
    timestamp: new Date().toISOString(),
    database,
  };
}

module.exports = { getHealthStatus };
