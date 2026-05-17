/**
 * Creates or promotes a system_admin user (same bcrypt rounds as auth).
 * Run from backend folder: npm run db:create-admin
 *
 * Env (or CLI overrides below):
 *   ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_FULL_NAME (optional)
 *
 * CLI:
 *   node scripts/create-admin.js you@example.com YourPassword "Бүтэн нэр"
 */
require("dotenv").config();
const bcrypt = require("bcryptjs");
const mysql = require("mysql2/promise");

const SALT_ROUNDS = 10;

/**
 * @param {import("mysql2/promise").Connection} conn
 * @param {string} column
 */
async function usersHasColumn(conn, column) {
  const [rows] = await conn.execute(
    `SELECT 1 AS ok
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = ?
     LIMIT 1`,
    [column],
  );
  return Array.isArray(rows) && rows.length > 0;
}

function argEmail() {
  const a = process.argv[2];
  return typeof a === "string" && a.trim() ? a.trim() : null;
}

function argPassword() {
  const a = process.argv[3];
  return typeof a === "string" ? a : "";
}

function argFullName() {
  const a = process.argv[4];
  if (typeof a === "string" && a.trim()) return a.trim();
  return (process.env.ADMIN_FULL_NAME || "Системийн админ").trim();
}

async function main() {
  const email = argEmail() || (process.env.ADMIN_EMAIL || "").trim();
  const password = argPassword() || process.env.ADMIN_PASSWORD || "";
  const full_name = argFullName();

  if (!email) {
    console.error("ADMIN_EMAIL эсвэл CLI: node scripts/create-admin.js <email> <password> [full_name]");
    process.exit(1);
  }
  if (!password || password.length < 4) {
    console.error("Нууц үг хамгийн багадаа 4 тэмдэгт (ADMIN_PASSWORD эсвэл 2-р CLI аргумент).");
    process.exit(1);
  }
  if (full_name.length < 2) {
    console.error("Бүтэн нэр хамгийн багадаа 2 тэмдэгт.");
    process.exit(1);
  }

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME || "healthcare_db",
  });

  try {
    const hasOnboarding = await usersHasColumn(conn, "onboarding_status");
    if (!hasOnboarding) {
      console.warn(
        "Анхаар: `users.onboarding_status` багана байхгүй. Хуучин schema ашиглаж байна. Бүтэн schema-д шилжих: backend/sql/schema.sql эсвэл migration.",
      );
    }

    const sql = hasOnboarding
      ? `INSERT INTO users (full_name, email, password_hash, role, onboarding_status, phone)
         VALUES (?, ?, ?, 'system_admin', 'approved', NULL)
         ON DUPLICATE KEY UPDATE
           full_name = VALUES(full_name),
           password_hash = VALUES(password_hash),
           role = 'system_admin',
           onboarding_status = 'approved'`
      : `INSERT INTO users (full_name, email, password_hash, role, phone)
         VALUES (?, ?, ?, 'system_admin', NULL)
         ON DUPLICATE KEY UPDATE
           full_name = VALUES(full_name),
           password_hash = VALUES(password_hash),
           role = 'system_admin'`;

    const [result] = await conn.execute(sql, [full_name, email.toLowerCase(), password_hash]);

    const isInsert = result.affectedRows === 1 && result.insertId > 0;
    console.log(isInsert ? "Шинэ системийн админ үүслээ." : "Имэйл байсан тул role/password шинэчлэгдлээ.");
    console.log("Имэйл:", email.toLowerCase());
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
