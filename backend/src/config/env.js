function asNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function asString(value, fallback = "") {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

/** Aiven / cloud MySQL: `?ssl=true` эсвэл `ssl-mode=REQUIRED` */
function parseDatabaseSslFromSearchParams(searchParams) {
  const ssl = searchParams.get("ssl");
  const sslMode = searchParams.get("ssl-mode") ?? searchParams.get("ssl_mode");
  const sslRequired =
    ssl === "true" ||
    ssl === "1" ||
    (typeof sslMode === "string" && sslMode.toUpperCase() === "REQUIRED");
  if (!sslRequired) return undefined;
  return { rejectUnauthorized: false };
}

function parseDatabaseUrl(raw) {
  if (!raw || typeof raw !== "string") return null;
  try {
    const url = new URL(raw);
    const database = url.pathname.replace(/^\//, "");
    if (!database) return null;
    const ssl = parseDatabaseSslFromSearchParams(url.searchParams);
    return {
      host: url.hostname,
      port: asNumber(url.port, 3306),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database,
      ...(ssl ? { ssl } : {}),
    };
  } catch {
    return null;
  }
}

function parseCorsOrigins(raw, nodeEnv) {
  const defaults =
    nodeEnv === "production"
      ? []
      : [
          "http://localhost:8081",
          "http://127.0.0.1:8081",
          "http://localhost:19006",
          "http://127.0.0.1:19006",
        ];

  const fromEnv =
    typeof raw === "string" && raw.trim()
      ? raw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

  return [...new Set([...defaults, ...fromEnv])];
}

const nodeEnv = asString(process.env.NODE_ENV, "development");
const jwtSecret = asString(process.env.JWT_SECRET, "dev-only-change-in-production");

if (nodeEnv === "production" && jwtSecret === "dev-only-change-in-production") {
  throw new Error("JWT_SECRET-ийг production орчинд заавал солих шаардлагатай.");
}

const fromDatabaseUrl = parseDatabaseUrl(process.env.DATABASE_URL);

const localDb = {
  host: asString(process.env.DB_HOST, "127.0.0.1"),
  port: asNumber(process.env.DB_PORT, 3306),
  user: asString(process.env.DB_USER, "root"),
  password: process.env.DB_PASSWORD ?? "",
  database: asString(process.env.DB_NAME, "healthcare_db"),
  connectionLimit: asNumber(process.env.DB_CONNECTION_LIMIT, 10),
};

const env = {
  nodeEnv,
  port: asNumber(process.env.PORT, 4000),
  host: asString(process.env.HOST, "0.0.0.0"),
  db: fromDatabaseUrl
    ? {
        ...fromDatabaseUrl,
        connectionLimit: asNumber(process.env.DB_CONNECTION_LIMIT, 10),
      }
    : localDb,
  jwt: {
    secret: jwtSecret,
    expiresIn: asString(process.env.JWT_EXPIRES_IN, "7d"),
  },
  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGINS, nodeEnv),
};

if (nodeEnv === "production" && env.corsOrigins.length === 0) {
  console.warn(
    "[env] CORS_ORIGINS хоосон байна. Firebase Hosting домэйнийг оруулна уу (жишээ: https://your-app.web.app).",
  );
}

module.exports = { env };
