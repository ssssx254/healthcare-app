const adminService = require("../services/admin.service");
const paymentsOverviewService = require("../services/paymentsOverview.service");
const { ok, okPaginated } = require("../utils/apiResponse");
const { asyncHandler } = require("../utils/asyncHandler");

const dashboard = asyncHandler(async (req, res) => {
  const data = await adminService.getDashboard(req.user);
  return ok(res, data, "Админ самбарын өгөгдөл.");
});

const paymentsOverview = asyncHandler(async (req, res) => {
  const data = await paymentsOverviewService.adminPaymentOverview(req.user);
  return ok(res, data, "Төлбөрийн тойм.");
});

const listPendingProviders = asyncHandler(async (req, res) => {
  const rows = await adminService.listPendingProviderRegistrations(req.user);
  return ok(res, rows, "Хүлээгдэж буй үйлчилгээ үзүүлэгчийн бүртгэлүүд.");
});

const reviewProvider = asyncHandler(async (req, res) => {
  const data = await adminService.reviewProviderRegistration(req.user, req.validatedParams.providerUserId, req.body);
  return ok(res, data, "Шийдвэр хадгалагдлаа.");
});

const listClinics = asyncHandler(async (req, res) => {
  const q = req.validatedQuery;
  const { items, total } = await adminService.listClinics(req.user, q);
  return okPaginated(res, { items, total, page: q.page, pageSize: q.pageSize });
});

const patchClinicApproval = asyncHandler(async (req, res) => {
  const row = await adminService.setClinicApproval(req.user, req.validatedParams.id, req.body);
  return ok(res, row, "Эмнэлгийн баталгаажуулалт шинэчлэгдлээ.");
});

const listDoctors = asyncHandler(async (req, res) => {
  const q = req.validatedQuery;
  const { items, total } = await adminService.listDoctors(req.user, q);
  return okPaginated(res, { items, total, page: q.page, pageSize: q.pageSize });
});

const listUsers = asyncHandler(async (req, res) => {
  const q = req.validatedQuery;
  const { items, total } = await adminService.listUsers(req.user, q);
  return okPaginated(res, { items, total, page: q.page, pageSize: q.pageSize });
});

const patchProviderSuspension = asyncHandler(async (req, res) => {
  const row = await adminService.patchProviderSuspension(req.user, req.validatedParams.providerUserId, req.body);
  return ok(res, row, "Үзүүлэгчийн төлөв шинэчлэгдлээ.");
});

const listContentReports = asyncHandler(async (req, res) => {
  const q = req.validatedQuery;
  const { items, total } = await adminService.listContentReports(req.user, q);
  return okPaginated(res, { items, total, page: q.page, pageSize: q.pageSize });
});

const patchContentReport = asyncHandler(async (req, res) => {
  const row = await adminService.reviewContentReport(req.user, req.validatedParams.id, req.body);
  return ok(res, row, "Мэдэгдэл шинэчлэгдлээ.");
});

const listFeatured = asyncHandler(async (req, res) => {
  const rows = await adminService.listFeaturedItems(req.user);
  return ok(res, rows);
});

const createFeatured = asyncHandler(async (req, res) => {
  const row = await adminService.createFeaturedItem(req.user, req.body);
  return ok(res, row, "Нэмэгдлээ.");
});

const patchFeatured = asyncHandler(async (req, res) => {
  const row = await adminService.updateFeaturedItem(req.user, req.validatedParams.id, req.body);
  return ok(res, row, "Шинэчлэгдлээ.");
});

const deleteFeatured = asyncHandler(async (req, res) => {
  const data = await adminService.deleteFeaturedItem(req.user, req.validatedParams.id);
  return ok(res, data, "Устгагдлаа.");
});

const broadcastNotification = asyncHandler(async (req, res) => {
  const data = await adminService.sendBroadcastNotification(req.user, req.body);
  return ok(res, data, "Мэдэгдэл илгээгдлээ.");
});

module.exports = {
  dashboard,
  paymentsOverview,
  listPendingProviders,
  reviewProvider,
  listClinics,
  patchClinicApproval,
  listDoctors,
  listUsers,
  patchProviderSuspension,
  listContentReports,
  patchContentReport,
  listFeatured,
  createFeatured,
  patchFeatured,
  deleteFeatured,
  broadcastNotification,
};
