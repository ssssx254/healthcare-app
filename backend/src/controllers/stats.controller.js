const statsService = require("../services/stats.service");
const { ok } = require("../utils/apiResponse");
const { asyncHandler } = require("../utils/asyncHandler");

const customerStats = asyncHandler(async (req, res) => {
  const data = await statsService.getCustomerStats(req.user);
  return ok(res, data, "Хэрэглэгчийн статистик.");
});

const providerStats = asyncHandler(async (req, res) => {
  const data = await statsService.getProviderStats(req.user);
  return ok(res, data, "Үзүүлэгчийн статистик.");
});

const adminStats = asyncHandler(async (req, res) => {
  const data = await statsService.getAdminStats(req.user);
  return ok(res, data, "Платформын статистик.");
});

module.exports = {
  customerStats,
  providerStats,
  adminStats,
};

