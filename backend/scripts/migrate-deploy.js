/**
 * Production DB — API эхлэхээс өмнө эсвэл deploy дараа нэг удаа ажиллуулна.
 * `npm run db:migrate:deploy`
 *
 * .env дээр production DATABASE_* тохируулсан байх ёстой.
 */
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const { getDbConnectOptions } = require("./dbConnectOptions");
const { CATCHUP_MIGRATIONS } = require("./migration-manifest");

async function main() {
  const conn = await mysql.createConnection(getDbConnectOptions());
  try {
    for (const file of CATCHUP_MIGRATIONS) {
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
