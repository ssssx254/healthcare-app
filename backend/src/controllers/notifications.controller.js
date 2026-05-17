const notificationsService = require("../services/notifications.service");
const { ok, okPaginated } = require("../utils/apiResponse");
const { asyncHandler } = require("../utils/asyncHandler");
const { AppError } = require("../utils/appError");

const listMine = asyncHandler(async (req, res) => {
  const q = req.validatedQuery;
  const { items, total } = await notificationsService.listMine(req.user.id, q);
  return okPaginated(res, { items, total, page: q.page, pageSize: q.pageSize });
});

const unreadCount = asyncHandler(async (req, res) => {
  const data = await notificationsService.getUnreadCount(req.user.id);
  return ok(res, data);
});

const markRead = asyncHandler(async (req, res) => {
  const data = await notificationsService.markRead(req.validatedParams.id, req.user.id);
  return ok(res, data, "Уншсан болгосон.");
});

const markAllRead = asyncHandler(async (req, res) => {
  const data = await notificationsService.markAllRead(req.user.id);
  return ok(res, data, "Бүгдийг уншсан болгосон.");
});

const registerPushToken = asyncHandler(async (req, res) => {
  const data = await notificationsService.registerPushToken(req.user.id, req.body);
  return ok(res, data, "Push token хадгалагдлаа.");
});

/** @deprecated — GET /notifications/me ашиглана */
const listForUserLegacy = asyncHandler(async (req, res) => {
  if (Number(req.user.id) !== Number(req.validatedParams.userId)) {
    throw new AppError(403, "Өөрийн мэдэгдлийг л харж болно.");
  }
  const q = req.validatedQuery;
  const { items, total } = await notificationsService.listMine(req.user.id, q);
  return okPaginated(res, { items, total, page: q.page, pageSize: q.pageSize });
});

module.exports = { listMine, unreadCount, markRead, markAllRead, registerPushToken, listForUserLegacy };
