/**
 * Локал MySQL — system_admin-аас бусад хэрэглэгчийг устгана.
 *
 *   node scripts/cleanup-local-users.js
 *   node scripts/cleanup-local-users.js --yes
 */
require("dotenv").config();
const mysql = require("mysql2/promise");
const { getDbConnectOptions, env } = require("./dbConnectOptions");

const KEEP_EMAIL = "admin1@gmail.com";

const USER_DEPENDENT_TABLES = [
  "booking_lab_tests",
  "questionnaire_answers",
  "questionnaires",
  "bookings",
  "consultation_requests",
  "chat_messages",
  "chat_conversation_reads",
  "chat_conversations",
  "wallet_transactions",
  "payment_methods",
  "pay_methods",
  "wallets",
  "notifications",
  "doctor_reviews",
  "clinic_reviews",
  "reviews",
  "medical_record_entries",
  "medical_records",
  "prescription_items",
  "prescriptions",
  "lab_test_results",
  "lab_tests",
  "content_reports",
  "provider_onboarding_submissions",
  "schedule_slots",
  "doctor_weekly_schedules",
  "services",
  "platform_featured_items",
  "clinic_service_categories",
  "doctors",
  "clinics",
];

function assertLocalDatabase() {
  const url = process.env.DATABASE_URL || "";
  const host = (env.db.host || "").toLowerCase();
  if (url && !/localhost|127\.0\.0\.1/i.test(url) && !/localhost|127\.0\.0\.1/i.test(host)) {
    if (!process.argv.includes("--force-remote")) {
      console.error("❌ Зөвхөн локал DB (localhost/127.0.0.1).");
      process.exit(1);
    }
  }
  if (host && host !== "127.0.0.1" && host !== "localhost" && !process.argv.includes("--force-remote")) {
    console.error(`❌ DB_HOST=${host} — зөвхөн локал.`);
    process.exit(1);
  }
}

async function tableExists(conn, name) {
  const [rows] = await conn.execute(
    `SELECT 1 FROM information_schema.tables
     WHERE table_schema = ? AND table_name = ? LIMIT 1`,
    [env.db.database, name],
  );
  return rows.length > 0;
}

async function main() {
  assertLocalDatabase();
  const yes = process.argv.includes("--yes");

  const conn = await mysql.createConnection(getDbConnectOptions());
  try {
    const [toDelete] = await conn.execute(
      `SELECT id, email, role, full_name FROM users
       WHERE LOWER(email) <> ? AND role <> 'system_admin'
       ORDER BY id`,
      [KEEP_EMAIL.toLowerCase()],
    );

    const [keep] = await conn.execute(`SELECT id, email, role FROM users WHERE LOWER(email) = ?`, [
      KEEP_EMAIL.toLowerCase(),
    ]);

    console.log(`\nDB: ${env.db.database} @ ${env.db.host}:${env.db.port}\n`);
    console.log("Үлдээх:", keep[0] ? `#${keep[0].id} ${keep[0].email} (${keep[0].role})` : "(админ олдсонгүй)");
    console.log("\nУстгах хэрэглэгч:", toDelete.length);
    for (const u of toDelete) {
      console.log(`  #${u.id} ${u.email} — ${u.full_name} (${u.role})`);
    }

    if (!yes) {
      console.log("\nУстгахын тулд: node scripts/cleanup-local-users.js --yes\n");
      return;
    }

    if (toDelete.length === 0) {
      console.log("\nУстгах хэрэглэгч байхгүй.\n");
      return;
    }

    const ids = toDelete.map((u) => u.id);

    await conn.beginTransaction();
    await conn.query("SET FOREIGN_KEY_CHECKS = 0");

    for (const table of USER_DEPENDENT_TABLES) {
      if (!(await tableExists(conn, table))) continue;
      const [r] = await conn.execute(`DELETE FROM \`${table}\``);
      if (r.affectedRows > 0) {
        console.log(`✓ ${table}: ${r.affectedRows} мөр`);
      }
    }

    const placeholders = ids.map(() => "?").join(",");
    const [del] = await conn.execute(`DELETE FROM users WHERE id IN (${placeholders})`, ids);
    console.log(`✓ users: ${del.affectedRows} хэрэглэгч устгагдлаа`);

    await conn.query("SET FOREIGN_KEY_CHECKS = 1");
    await conn.commit();

    console.log(`\n✅ Админ (${KEEP_EMAIL}) үлдлээ. Бусад хэрэглэгч цэвэрлэгдлээ.\n`);
  } catch (e) {
    await conn.rollback().catch(() => {});
    console.error("Алдаа:", e.message);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

main();
