/**
 * MySQL CLI (`mysql`) PATH-д байхгүй үед migration ажиллуулна.
 * Backend хавтаснаас: npm run db:migrate -- sql/migrations/003_clinic_approval_and_wallet.sql
 */
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const { getDbConnectOptions } = require("./dbConnectOptions");

async function main() {
  const rel = process.argv[2];
  if (!rel) {
    console.error("Ашиглалт: npm run db:migrate -- sql/migrations/003_clinic_approval_and_wallet.sql");
    process.exit(1);
  }
  const abs = path.resolve(process.cwd(), rel);
  if (!fs.existsSync(abs)) {
    console.error("Файл олдсонгүй:", abs);
    process.exit(1);
  }
  const sql = fs.readFileSync(abs, "utf8");
  const conn = await mysql.createConnection(getDbConnectOptions());
  try {
    await conn.query(sql);
    console.log("Амжилттай:", abs);
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
