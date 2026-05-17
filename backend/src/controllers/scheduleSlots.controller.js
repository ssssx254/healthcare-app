const scheduleSlotsService = require("../services/scheduleSlots.service");
const { ok, created, okPaginated } = require("../utils/apiResponse");
const { asyncHandler } = require("../utils/asyncHandler");

const create = asyncHandler(async (req, res) => {
  const row = await scheduleSlotsService.createSlot(req.user.id, req.body);
  return created(res, row, "Цаг нэмэгдлээ");
});

const list = asyncHandler(async (req, res) => {
  const q = req.validatedQuery;
  const { items, total } = await scheduleSlotsService.listSlots(q);
  return okPaginated(res, { items, total, page: q.page, pageSize: q.pageSize });
});

const update = asyncHandler(async (req, res) => {
  const row = await scheduleSlotsService.updateSlot(req.validatedParams.id, req.user.id, req.body);
  return ok(res, row, "Шинэчлэгдлээ");
});

const saveWeeklySchedule = asyncHandler(async (req, res) => {
  const row = await scheduleSlotsService.saveDoctorWeeklySchedule(
    req.user.id,
    req.validatedParams.doctorId,
    req.body.weekly_schedule,
  );
  return ok(res, row, "Weekly schedule хадгалагдлаа");
});

const generateSlots = asyncHandler(async (req, res) => {
  const row = await scheduleSlotsService.generateSlotsFromWeeklySchedule(req.user.id, req.body);
  return ok(res, row, "Цагийн slot үүсгэлээ");
});

const blockSlot = asyncHandler(async (req, res) => {
  const row = await scheduleSlotsService.blockSlot(req.validatedParams.id, req.user.id);
  return ok(res, row, "Слот blocked төлөвт орлоо");
});

const markUnavailable = asyncHandler(async (req, res) => {
  const row = await scheduleSlotsService.markSlotUnavailable(req.validatedParams.id, req.user.id);
  return ok(res, row, "Слот unavailable төлөвт орлоо");
});

const listAvailableForCustomer = asyncHandler(async (req, res) => {
  const q = req.validatedQuery;
  const { items, total } = await scheduleSlotsService.listDoctorAvailableSlotsForCustomer(q);
  return okPaginated(res, { items, total, page: q.page, pageSize: q.pageSize });
});

module.exports = {
  create,
  list,
  update,
  saveWeeklySchedule,
  generateSlots,
  blockSlot,
  markUnavailable,
  listAvailableForCustomer,
};
