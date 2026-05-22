/**
 * Migration скриптүүд API-тай ижил DB тохиргоо ашиглана (DATABASE_URL эсвэл DB_*).
 */
require("dotenv").config();
const { env } = require("../src/config/env");

function getDbConnectOptions(extra = {}) {
  const opts = {
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.database,
    multipleStatements: true,
    ...extra,
  };
  if (env.db.ssl) {
    opts.ssl = env.db.ssl;
  }
  return opts;
}

module.exports = { getDbConnectOptions, env };
