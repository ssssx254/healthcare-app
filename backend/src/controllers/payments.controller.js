const paymentsOverviewService = require("../services/paymentsOverview.service");
const { ok } = require("../utils/apiResponse");
const { asyncHandler } = require("../utils/asyncHandler");

const providerRevenue = asyncHandler(async (req, res) => {
  const data = await paymentsOverviewService.providerRevenueSummary(req.user, req.query);
  return ok(res, data);
});

module.exports = { providerRevenue };
