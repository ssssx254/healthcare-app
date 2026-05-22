/**
 * Хуучин суурь → одоогийн API. Дараалсан migration-уудыг нэг дор ажиллуулна.
 * `npm run db:migrate:catchup`
 */
require("dotenv").config();
const { execSync } = require("child_process");
const path = require("path");

const root = path.join(__dirname, "..");
const files = [
  "002_bookings_meeting_link.sql",
  "003_clinic_approval_and_wallet.sql",
  "004_doctors_list_columns.sql",
  "005_clinics_city_type_email.sql",
  "006_doctors_title_bio.sql",
  "007_safe_catchup_core_columns_wallet_and_stats_indexes.sql",
  "008_chat_api_performance_indexes.sql",
  "009_safe_chat_core_tables.sql",
  "010_doctor_reviews.sql",
  "011_lab_tests.sql",
  "012_booking_lab_tests.sql",
  "013_payment_methods.sql",
  "014_free_consultation_flow.sql",
];

for (const f of files) {
  const rel = `sql/migrations/${f}`;
  console.log("\n>>>", rel);
  execSync(`node scripts/run-migration.js ${rel}`, {
    cwd: root,
    stdio: "inherit",
    env: process.env,
    shell: true,
  });
}
console.log("\nБүгд дууслаа. API-г (`npm start`) дахин эхлүүлнэ үү.");
