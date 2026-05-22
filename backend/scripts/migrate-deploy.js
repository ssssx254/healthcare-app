/**
 * Render / production deploy — шаардлагатай idempotent migration-уудыг API эхлэхээс өмнө ажиллуулна.
 * Одоогоор: lab_tests (011).
 */
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const { getDbConnectOptions } = require("./dbConnectOptions");

const DEPLOY_MIGRATIONS = [
  "011_lab_tests.sql",
  "012_booking_lab_tests.sql",
  "013_payment_methods.sql",
  "014_free_consultation_flow.sql",
];

async function main() {
  const conn = await mysql.createConnection(getDbConnectOptions());
  try {
    for (const file of DEPLOY_MIGRATIONS) {
      const abs = path.join(__dirname, "..", "sql/migrations", file);
      if (!fs.existsSync(abs)) {
        throw new Error(`Migration файл олдсонгүй: ${abs}`);
      }
      const sql = fs.readFileSync(abs, "utf8");
      console.log("[migrate-deploy] Running", file);
      await conn.query(sql);
      console.log("[migrate-deploy] OK", file);
    }
    console.log("[migrate-deploy] Бүгд амжилттай.");
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("[migrate-deploy] FAILED:", err.message);
  process.exit(1);
});
