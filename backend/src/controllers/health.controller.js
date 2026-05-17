const { getHealthStatus } = require("../services/health.service");
const { ok } = require("../utils/apiResponse");
const { asyncHandler } = require("../utils/asyncHandler");

const healthCheck = asyncHandler(async (req, res) => {
  const data = await getHealthStatus();
  return ok(res, data, "Сервер ажиллаж байна");
});

module.exports = { healthCheck };
