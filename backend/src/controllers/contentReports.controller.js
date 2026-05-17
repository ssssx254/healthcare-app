const contentReportsService = require("../services/contentReports.service");
const { created } = require("../utils/apiResponse");
const { asyncHandler } = require("../utils/asyncHandler");

const create = asyncHandler(async (req, res) => {
  const row = await contentReportsService.createContentReport(req.user, req.body);
  return created(res, row, "Мэдэгдэл илгээгдлээ.");
});

module.exports = { create };
