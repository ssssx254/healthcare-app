const mysql = require("mysql2/promise");
const { env } = require("./env");

/**
 * Shared MySQL connection pool (mysql2).
 * Cloud providers (Aiven): DATABASE_URL with `?ssl=true` → TLS with rejectUnauthorized: false.
 */
const poolOptions = {
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  waitForConnections: true,
  connectionLimit: env.db.connectionLimit,
  queueLimit: 0,
};

if (env.db.ssl) {
  poolOptions.ssl = env.db.ssl;
}

const pool = mysql.createPool(poolOptions);

/** Нууц үг, credential-ийг логноос хасна. */
function sanitizeDbErrorMessage(message) {
  return String(message)
    .replace(/:\/\/([^:@/]+):([^@/]+)@/g, "://$1:***@")
    .replace(/(password\s*[=:]\s*)[^\s;,)]+/gi, "$1***")
    .replace(/(pwd\s*[=:]\s*)[^\s;,)]+/gi, "$1***");
}

/**
 * Production-д DB алдааг тодорхой логлох (нууц үггүй).
 */
function logDatabaseConnectionError(err, context = "database") {
  const code = err?.code ?? "UNKNOWN";
  const errno = err?.errno;
  const sqlState = err?.sqlState;
  const message = sanitizeDbErrorMessage(err?.message ?? err);

  console.error(`[${context}] MySQL connection failed`, {
    code,
    ...(errno != null ? { errno } : {}),
    ...(sqlState ? { sqlState } : {}),
    message,
    host: env.db.host,
    port: env.db.port,
    database: env.db.database,
    ssl: Boolean(env.db.ssl),
  });
}

/**
 * Health check: SELECT 1 амжилттай болсон эсэх.
 * @returns {Promise<boolean>}
 */
async function pingDatabase() {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query("SELECT 1 AS ok");
    if (!Array.isArray(rows) || rows.length === 0) return false;
    return Number(rows[0].ok) === 1;
  } finally {
    connection.release();
  }
}

module.exports = { pool, pingDatabase, logDatabaseConnectionError, sanitizeDbErrorMessage };
