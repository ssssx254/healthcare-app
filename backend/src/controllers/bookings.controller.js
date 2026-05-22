const bookingsService = require("../services/bookings.service");
const { ok, created, okPaginated } = require("../utils/apiResponse");
const { asyncHandler } = require("../utils/asyncHandler");

const create = asyncHandler(async (req, res) => {
  const row = await bookingsService.createBooking(req.user.id, req.body);
  return created(res, row, "Захиалга үүслээ");
});

const list = asyncHandler(async (req, res) => {
  const q = req.validatedQuery;
  const { items, total } = await bookingsService.listBookings(req.user, q);
  return okPaginated(res, { items, total, page: q.page, pageSize: q.pageSize });
});

const listCustomer = asyncHandler(async (req, res) => {
  const q = req.validatedQuery;
  const { items, total } = await bookingsService.listCustomerBookings(req.user.id, q);
  return okPaginated(res, { items, total, page: q.page, pageSize: q.pageSize });
});

const listProvider = asyncHandler(async (req, res) => {
  const q = req.validatedQuery;
  const { items, total } = await bookingsService.listProviderBookings(req.user.id, q);
  return okPaginated(res, { items, total, page: q.page, pageSize: q.pageSize });
});

const getOne = asyncHandler(async (req, res) => {
  const row = await bookingsService.getBookingById(req.validatedParams.id, req.user);
  return ok(res, row);
});

const listSharedLabTests = asyncHandler(async (req, res) => {
  const data = await bookingsService.listBookingSharedLabTests(req.validatedParams.id, req.user);
  return ok(res, data);
});

const updateStatus = asyncHandler(async (req, res) => {
  const row = await bookingsService.updateBookingStatus(req.validatedParams.id, req.user, req.body);
  return ok(res, row, "Захиалга шинэчлэгдлээ");
});

const markPaid = asyncHandler(async (req, res) => {
  const row = await bookingsService.markBookingPaid(req.validatedParams.id, req.user, req.body);
  const data = row?.booking ?? row;
  return ok(res, data, "Төлбөр бүртгэгдлээ");
});

const cancel = asyncHandler(async (req, res) => {
  const row = await bookingsService.cancelBooking(req.validatedParams.id, req.user);
  return ok(res, row, "Захиалга цуцлагдлаа");
});

module.exports = {
  create,
  list,
  listCustomer,
  listProvider,
  getOne,
  listSharedLabTests,
  updateStatus,
  cancel,
  markPaid,
};
