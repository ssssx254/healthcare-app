const { pool } = require("../config/database");
const { AppError } = require("../utils/appError");
const { ROLES } = require("../constants/roles");
const { assertPositiveIntId } = require("../utils/validation");
const providerOnboardingService = require("./providerOnboarding.service");
const clinicsRepo = require("../repositories/clinics.repository");
const doctorsService = require("./doctors.service");
const paymentsOverviewService = require("./paymentsOverview.service");
const contentReportsRepo = require("../repositories/contentReports.repository");
const platformFeaturedRepo = require("../repositories/platformFeatured.repository");
const {
  validateClinicApprovalBody,
  validateContentReportReviewBody,
  validateFeaturedCreateBody,
  validateFeaturedUpdateBody,
  validateNotificationBroadcastBody,
} = require("../validators/admin.validators");
const notificationsService = require("./notifications.service");

function assertSystemAdmin(user) {
  if (!user || user.role !== ROLES.SYSTEM_ADMIN) {
    throw new AppError(403, "Зөвхөн системийн админ энэ үйлдлийг хийнэ.");
  }
}

async function getDashboard(user) {
  assertSystemAdmin(user);
  const [[counts]] = await pool.execute(
    `SELECT
       (SELECT COUNT(*) FROM users WHERE role = 'customer') AS total_customers,
       (SELECT COUNT(*) FROM users WHERE role = 'provider') AS total_providers,
       (SELECT COUNT(*) FROM users WHERE role = 'system_admin') AS total_system_admins,
       (SELECT COUNT(*) FROM clinics WHERE approval_status = 'pending') AS pending_clinics,
       (SELECT COUNT(*) FROM bookings) AS total_bookings,
       (SELECT COUNT(*) FROM consultation_requests) AS total_consultations,
       (SELECT COUNT(*) FROM users WHERE role = 'provider' AND onboarding_status = 'pending') AS pending_provider_registrations,
       (SELECT COUNT(*) FROM content_reports WHERE status = 'open') AS open_content_reports,
       (SELECT COUNT(*) FROM platform_featured_items WHERE is_active = 1) AS active_featured_items`,
  );
  const payments = await paymentsOverviewService.adminPaymentOverview(user);
  return {
    platform: {
      total_customers: Number(counts?.total_customers || 0),
      total_providers: Number(counts?.total_providers || 0),
      total_system_admins: Number(counts?.total_system_admins || 0),
      pending_clinics: Number(counts?.pending_clinics || 0),
      total_bookings: Number(counts?.total_bookings || 0),
      total_consultations: Number(counts?.total_consultations || 0),
      pending_provider_registrations: Number(counts?.pending_provider_registrations || 0),
      open_content_reports: Number(counts?.open_content_reports || 0),
      active_featured_items: Number(counts?.active_featured_items || 0),
    },
    payments,
  };
}

async function listPendingProviderRegistrations(user) {
  assertSystemAdmin(user);
  return providerOnboardingService.listPendingProviderSubmissions();
}

async function reviewProviderRegistration(user, providerUserId, body) {
  assertSystemAdmin(user);
  const id = assertPositiveIntId(providerUserId, "provider_user_id");
  const { decision, feedback } = body;
  return providerOnboardingService.approveOrRejectProvider({
    adminUser: user,
    providerUserId: id,
    decision,
    feedback,
  });
}

async function listClinics(user, validatedQuery) {
  assertSystemAdmin(user);
  const total = await clinicsRepo.countClinicsForAdmin(validatedQuery);
  const items = await clinicsRepo.listClinicsForAdminPaged(validatedQuery);
  return { items, total };
}

async function setClinicApproval(user, clinicId, body) {
  assertSystemAdmin(user);
  const id = assertPositiveIntId(clinicId, "clinic_id");
  const { approval_status } = validateClinicApprovalBody(body);
  const clinic = await clinicsRepo.findClinicById(id);
  if (!clinic) throw new AppError(404, "Эмнэлэг олдсонгүй.");
  await clinicsRepo.updateClinicApprovalStatus(id, approval_status);
  return clinicsRepo.findClinicById(id);
}

async function listDoctors(user, validatedQuery) {
  assertSystemAdmin(user);
  return doctorsService.listDoctors(validatedQuery, { admin: true });
}

async function listUsers(user, validatedQuery) {
  assertSystemAdmin(user);
  const where = [];
  const params = [];
  if (validatedQuery.role) {
    where.push("u.role = ?");
    params.push(validatedQuery.role);
  }
  if (validatedQuery.q) {
    where.push("(u.full_name LIKE ? OR u.email LIKE ?)");
    const like = `%${validatedQuery.q}%`;
    params.push(like, like);
  }
  const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
  const safeLimit = Math.max(1, Number(validatedQuery.pageSize) || 20);
  const safeOffset = Math.max(0, Number(validatedQuery.offset) || 0);
  const [countRows] = await pool.execute(`SELECT COUNT(*) AS c FROM users u ${whereSql}`, params);
  const [items] = await pool.execute(
    `SELECT u.id, u.full_name, u.email, u.phone, u.role, u.onboarding_status, u.created_at,
            c.id AS clinic_id, c.clinic_name, c.approval_status
       FROM users u
       LEFT JOIN clinics c ON c.owner_user_id = u.id
       ${whereSql}
      ORDER BY u.${validatedQuery.sortBy} ${validatedQuery.sortDir.toUpperCase()}
      LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    params,
  );
  return { items, total: Number(countRows?.[0]?.c || 0) };
}

async function patchProviderSuspension(user, providerUserId, body) {
  assertSystemAdmin(user);
  const id = assertPositiveIntId(providerUserId, "provider_user_id");
  const suspended = Boolean(body?.suspended);
  const [rows] = await pool.execute(
    `SELECT id, role, onboarding_status, full_name, email FROM users WHERE id = ? LIMIT 1`,
    [id],
  );
  const row = rows?.[0];
  if (!row) throw new AppError(404, "Үзүүлэгч олдсонгүй.");
  if (row.role !== ROLES.PROVIDER) throw new AppError(400, "Зөвхөн provider хэрэглэгчийг түдгэлзүүлнэ.");
  const nextStatus = suspended ? "rejected" : "approved";
  await pool.execute(`UPDATE users SET onboarding_status = ? WHERE id = ?`, [nextStatus, id]);
  return {
    id: Number(row.id),
    full_name: row.full_name,
    email: row.email,
    onboarding_status: nextStatus,
    suspended,
  };
}

async function listContentReports(user, validatedQuery) {
  assertSystemAdmin(user);
  const total = await contentReportsRepo.countReportsForAdmin({ status: validatedQuery.status });
  const items = await contentReportsRepo.listReportsForAdmin({
    status: validatedQuery.status,
    pageSize: validatedQuery.pageSize,
    offset: validatedQuery.offset,
  });
  return { items, total };
}

async function reviewContentReport(user, reportId, body) {
  assertSystemAdmin(user);
  const id = assertPositiveIntId(reportId, "report_id");
  const { status, admin_notes } = validateContentReportReviewBody(body);
  const row = await contentReportsRepo.findReportById(id);
  if (!row) throw new AppError(404, "Мэдэгдэл олдсонгүй.");
  return contentReportsRepo.updateReportReview(id, {
    status,
    admin_notes,
    reviewed_by: user.id,
  });
}

async function listFeaturedItems(user) {
  assertSystemAdmin(user);
  return platformFeaturedRepo.listFeaturedItemsAdmin();
}

async function createFeaturedItem(user, body) {
  assertSystemAdmin(user);
  const data = validateFeaturedCreateBody(body);
  if (data.item_type === "clinic") {
    const clinic = await clinicsRepo.findClinicById(data.clinic_id);
    if (!clinic) throw new AppError(404, "Эмнэлэг олдсонгүй.");
  }
  return platformFeaturedRepo.insertFeatured({
    item_type: data.item_type,
    clinic_id: data.clinic_id ?? null,
    article_title: data.article_title ?? null,
    article_excerpt: data.article_excerpt ?? null,
    article_url: data.article_url ?? null,
    sort_order: data.sort_order,
    is_active: data.is_active,
  });
}

async function updateFeaturedItem(user, itemId, body) {
  assertSystemAdmin(user);
  const id = assertPositiveIntId(itemId, "id");
  const existing = await platformFeaturedRepo.getById(id);
  if (!existing) throw new AppError(404, "Олдсонгүй.");
  const patch = validateFeaturedUpdateBody(body);
  return platformFeaturedRepo.updateFeatured(id, patch);
}

async function deleteFeaturedItem(user, itemId) {
  assertSystemAdmin(user);
  const id = assertPositiveIntId(itemId, "id");
  const existing = await platformFeaturedRepo.getById(id);
  if (!existing) throw new AppError(404, "Олдсонгүй.");
  await platformFeaturedRepo.deleteFeatured(id);
  return { deleted: true, id };
}

async function sendBroadcastNotification(user, body) {
  assertSystemAdmin(user);
  const payload = validateNotificationBroadcastBody(body);
  const whereSql = payload.audience === "all" ? "" : "WHERE role = ?";
  const params = payload.audience === "all" ? [] : [payload.audience];
  const [rows] = await pool.execute(
    `SELECT id, expo_push_token
       FROM users
       ${whereSql}`,
    params,
  );
  const targets = rows || [];
  if (targets.length === 0) {
    throw new AppError(404, "Сонгосон бүлэгт илгээх хэрэглэгч олдсонгүй.");
  }
  let createdCount = 0;
  for (const target of targets) {
    await notificationsService.createNotification({
      user_id: Number(target.id),
      title: payload.title,
      body: payload.message,
      type: payload.type,
      reference_type: "admin_broadcast",
      reference_id: null,
      metadata: {
        audience: payload.audience,
        sent_by_admin_user_id: user.id,
      },
    });
    createdCount += 1;
  }
  const pushReadyCount = targets.filter((x) => Boolean(x.expo_push_token)).length;
  return {
    audience: payload.audience,
    sent_count: createdCount,
    push_ready_count: pushReadyCount,
  };
}

module.exports = {
  getDashboard,
  listPendingProviderRegistrations,
  reviewProviderRegistration,
  listClinics,
  setClinicApproval,
  listDoctors,
  listUsers,
  patchProviderSuspension,
  listContentReports,
  reviewContentReport,
  listFeaturedItems,
  createFeaturedItem,
  updateFeaturedItem,
  deleteFeaturedItem,
  sendBroadcastNotification,
};
