/**
 * Хуучин суурь → одоогийн API. Дараалсан migration-уудыг нэг дор ажиллуулна.
 * `npm run db:migrate:catchup`
 */
require("dotenv").config();
const { execSync } = require("child_process");
const path = require("path");
const { CATCHUP_MIGRATIONS } = require("./migration-manifest");

const root = path.join(__dirname, "..");

for (const f of CATCHUP_MIGRATIONS) {
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
