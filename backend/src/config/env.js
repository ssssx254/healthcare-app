function asNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function asString(value, fallback = "") {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

const nodeEnv = asString(process.env.NODE_ENV, "development");
const jwtSecret = asString(process.env.JWT_SECRET, "dev-only-change-in-production");

if (nodeEnv === "production" && jwtSecret === "dev-only-change-in-production") {
  throw new Error("JWT_SECRET-ийг production орчинд заавал солих шаардлагатай.");
}

const env = {
  nodeEnv,
  port: asNumber(process.env.PORT, 4000),
  host: asString(process.env.HOST, "0.0.0.0"),
  db: {
    host: asString(process.env.DB_HOST, "127.0.0.1"),
    port: asNumber(process.env.DB_PORT, 3306),
    user: asString(process.env.DB_USER, "root"),
    password: process.env.DB_PASSWORD ?? "",
    database: asString(process.env.DB_NAME, "healthcare_db"),
    connectionLimit: asNumber(process.env.DB_CONNECTION_LIMIT, 10),
  },
  jwt: {
    secret: jwtSecret,
    expiresIn: asString(process.env.JWT_EXPIRES_IN, "7d"),
  },
};

module.exports = { env };
