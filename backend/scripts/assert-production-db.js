/**
 * Production migration ажиллуулахын өмнө локал DB руу буруу холбогдохоос сэргийлнэ.
 * DATABASE_URL (Aiven/Render) эсвэл ALLOW_LOCAL_MIGRATE=1 шаардлагатай.
 */
require("dotenv").config();
const { env } = require("../src/config/env");

const host = String(env.db.host || "").toLowerCase();
const isLocal =
  host === "127.0.0.1" ||
  host === "localhost" ||
  host === "::1" ||
  host.startsWith("192.168.") ||
  host.startsWith("10.");

if (isLocal && !process.env.ALLOW_LOCAL_MIGRATE) {
  console.error("❌ Одоогийн DB холболт LOCAL байна:", host, "→", env.db.database);
  console.error("");
  console.error("Production (Aiven) дээр migration ажиллуулахын тулд:");
  console.error("  1. Render Dashboard → Environment → DATABASE_URL хуулна");
  console.error("  2. backend/.env дээр DATABASE_URL=... (эсвэл түр) тавина");
  console.error("  3. DB_HOST/DB_NAME-ийг түр comment хийнэ (DATABASE_URL давуу)");
  console.error("  4. npm run db:migrate:production");
  console.error("");
  console.error("Зөвхөн локал дээр ажиллуулах бол: ALLOW_LOCAL_MIGRATE=1 npm run db:migrate:catchup");
  process.exit(1);
}

console.log("✓ Migration target:", host, "→", env.db.database);
