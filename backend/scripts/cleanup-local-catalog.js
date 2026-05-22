/**
 * Локал MySQL — эмнэлэг, эмч, үйлчилгээ, захиалга зэрэг каталогийг цэвэрлэнэ.
 * Зөвхөн localhost DB дээр ажиллана (production/Aiven-д хориглоно).
 *
 * Хэрэглээ:
 *   node scripts/cleanup-local-catalog.js           # жагсаалт
 *   node scripts/cleanup-local-catalog.js --yes     # устгах
 */
require("dotenv").config();
const mysql = require("mysql2/promise");
const { getDbConnectOptions, env } = require("./dbConnectOptions");

const TABLES_CHILD_FIRST = [
  "booking_lab_tests",
  "questionnaire_answers",
  "questionnaires",
  "bookings",
  "consultation_requests",
  "chat_messages",
  "chat_conversations",
  "schedule_slots",
  "doctor_weekly_schedules",
  "doctor_reviews",
  "clinic_reviews",
  "medical_record_entries",
  "medical_records",
  "prescription_items",
  "prescriptions",
  "lab_test_results",
  "lab_tests",
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
      console.error(
        "❌ Энэ скрипт зөвхөн локал DB-д зориулагдсан. Aiven/production-д ажиллуулахгүй.\n" +
          "   DATABASE_URL эсвэл DB_HOST = localhost/127.0.0.1 байх ёстой.",
      );
      process.exit(1);
    }
    console.warn("⚠ --force-remote: алсын DB дээр цэвэрлэж байна!");
  }
  if (host && host !== "127.0.0.1" && host !== "localhost" && !process.argv.includes("--force-remote")) {
    console.error(`❌ DB_HOST=${host} — зөвхөн 127.0.0.1 эсвэл localhost.`);
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

async function countRows(conn, table) {
  if (!(await tableExists(conn, table))) return null;
  const [rows] = await conn.execute(`SELECT COUNT(*) AS c FROM \`${table}\``);
  return Number(rows[0]?.c ?? 0);
}

async function main() {
  assertLocalDatabase();
  const yes = process.argv.includes("--yes");

  const conn = await mysql.createConnection(getDbConnectOptions());
  try {
    const [clinics] = await conn.execute(
      `SELECT id, clinic_name, owner_user_id FROM clinics ORDER BY id`,
    );
    const [doctors] = await conn.execute(
      `SELECT id, clinic_id, full_name, specialization FROM doctors ORDER BY id`,
    );

    console.log(`\nDB: ${env.db.database} @ ${env.db.host}:${env.db.port}\n`);
    console.log("Эмнэлэг:", clinics.length);
    for (const c of clinics) {
      console.log(`  #${c.id} ${c.clinic_name} (owner ${c.owner_user_id})`);
    }
    console.log("\nЭмч:", doctors.length);
    for (const d of doctors) {
      console.log(`  #${d.id} ${d.full_name} — ${d.specialization} (clinic ${d.clinic_id})`);
    }

    if (!yes) {
      console.log("\nУстгахын тулд: node scripts/cleanup-local-catalog.js --yes\n");
      return;
    }

    await conn.beginTransaction();
    await conn.query("SET FOREIGN_KEY_CHECKS = 0");

    for (const table of TABLES_CHILD_FIRST) {
      if (!(await tableExists(conn, table))) continue;
      const before = await countRows(conn, table);
      if (before === 0) continue;
      await conn.query(`DELETE FROM \`${table}\``);
      console.log(`✓ ${table}: ${before} мөр устгагдлаа`);
    }

    await conn.query("SET FOREIGN_KEY_CHECKS = 1");
    await conn.commit();

    console.log("\n✅ Локал эмнэлэг/эмч/каталог цэвэрлэгдлээ.");
    console.log("   Хэрэглэгч (users) хэвээр — зөвхөн provider бүртгэл дахин үүсгэнэ.");
    console.log("   Expo дээр ангилал AsyncStorage-д үлдсэн бол апп дахин нээж provider ангилал дахин нэмнэ.\n");
  } catch (e) {
    await conn.rollback().catch(() => {});
    console.error("Алдаа:", e.message);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

main();
