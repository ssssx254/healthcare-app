const { AppError } = require("../utils/appError");
const { validateContentReportCreateBody } = require("../validators/contentReports.validators");
const contentReportsRepo = require("../repositories/contentReports.repository");

async function createContentReport(user, body) {
  if (!user?.id) {
    throw new AppError(401, "Нэвтэрсэн эрх шаардлагатай.");
  }
  const payload = validateContentReportCreateBody(body);
  return contentReportsRepo.insertReport({
    reporter_user_id: user.id,
    target_type: payload.target_type,
    target_id: payload.target_id,
    reason_code: payload.reason_code,
    details: payload.details,
  });
}

module.exports = {
  createContentReport,
};
