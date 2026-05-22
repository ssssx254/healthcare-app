/**
 * Бүх pending provider-ийг батална (онбординг + эмнэлэг үүсгэнэ).
 *
 *   npm run db:approve-pending-providers
 *   npm run db:approve-pending-providers -- admin1@gmail.com
 *
 * DATABASE_URL эсвэл DB_* — create-admin-тай ижил.
 */
require("dotenv").config();
const authRepo = require("../src/repositories/auth.repository");
const providerOnboardingRepo = require("../src/repositories/providerOnboarding.repository");
const providerOnboardingService = require("../src/services/providerOnboarding.service");
const { ROLES } = require("../src/constants/roles");

function adminEmailArg() {
  const a = process.argv[2];
  return typeof a === "string" && a.trim() ? a.trim().toLowerCase() : (process.env.ADMIN_EMAIL || "admin1@gmail.com").trim().toLowerCase();
}

async function main() {
  const adminEmail = adminEmailArg();
  const adminRow = await authRepo.findUserAuthByEmail(adminEmail);
  if (!adminRow || adminRow.role !== ROLES.SYSTEM_ADMIN) {
    console.error(`Системийн админ олдсонгүй (${adminEmail}). Эхлээд: npm run db:create-admin -- ${adminEmail} <password>`);
    process.exit(1);
  }

  const adminUser = {
    id: adminRow.id,
    role: adminRow.role,
    full_name: adminRow.full_name,
    email: adminRow.email,
    onboarding_status: adminRow.onboarding_status,
  };

  const pending = await providerOnboardingRepo.listPendingProvidersForAdmin();
  if (!pending.length) {
    console.log("Pending provider байхгүй.");
    return;
  }

  for (const row of pending) {
    const providerUserId = Number(row.provider_user_id);
    await providerOnboardingService.approveOrRejectProvider({
      adminUser,
      providerUserId,
      decision: "approved",
      feedback: null,
    });
    console.log(`Батлагдлаа: #${providerUserId} ${row.provider_email || row.provider_full_name} (${row.clinic_name || "—"})`);
  }

  console.log(`Нийт ${pending.length} provider батлагдлаа.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
