const mysql = require("mysql2/promise");
const { env } = require("./env");

/**
 * Shared MySQL connection pool (mysql2).
 * Import `pool` in services or route handlers when you add real queries.
 */
const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  waitForConnections: true,
  connectionLimit: env.db.connectionLimit,
  queueLimit: 0,
});

/**
 * Ping the database (used by health check).
 * @returns {Promise<boolean>}
 */
async function pingDatabase() {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
    return true;
  } finally {
    connection.release();
  }
}

module.exports = { pool, pingDatabase };
