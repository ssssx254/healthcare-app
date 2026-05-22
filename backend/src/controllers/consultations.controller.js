const consultationsService = require("../services/consultations.service");
const { ok, created, okPaginated } = require("../utils/apiResponse");
const { asyncHandler } = require("../utils/asyncHandler");

const create = asyncHandler(async (req, res) => {
  const row = await consultationsService.createConsultation(req.user.id, req.body);
  return created(res, row, "Үнэгүй зөвлөгөөний хүсэлт илгээгдлээ");
});

const createFree = asyncHandler(async (req, res) => {
  const row = await consultationsService.createConsultation(req.user.id, req.body);
  return created(res, row, "Үнэгүй зөвлөгөөний хүсэлт илгээгдлээ");
});

const listFreeAvailability = asyncHandler(async (req, res) => {
  const data = await consultationsService.listFreeConsultationAvailability(req.query);
  return ok(res, data);
});

const list = asyncHandler(async (req, res) => {
  const q = req.validatedQuery;
  const { items, total } = await consultationsService.listConsultations(req.user, q);
  return okPaginated(res, { items, total, page: q.page, pageSize: q.pageSize });
});

const listCustomer = asyncHandler(async (req, res) => {
  const q = req.validatedQuery;
  const { items, total } = await consultationsService.listCustomerConsultations(req.user.id, q);
  return okPaginated(res, { items, total, page: q.page, pageSize: q.pageSize });
});

const listProvider = asyncHandler(async (req, res) => {
  const q = req.validatedQuery;
  const { items, total } = await consultationsService.listProviderConsultations(req.user.id, q);
  return okPaginated(res, { items, total, page: q.page, pageSize: q.pageSize });
});

const getOne = asyncHandler(async (req, res) => {
  const row = await consultationsService.getConsultationByIdForUser(req.validatedParams.id, req.user);
  return ok(res, row);
});

const update = asyncHandler(async (req, res) => {
  const row = await consultationsService.updateConsultation(req.validatedParams.id, req.user, req.body);
  return ok(res, row, "Шинэчлэгдлээ");
});

const cancel = asyncHandler(async (req, res) => {
  const row = await consultationsService.cancelConsultation(req.validatedParams.id, req.user);
  return ok(res, row, "Хүсэлт цуцлагдлаа");
});

module.exports = {
  create,
  createFree,
  listFreeAvailability,
  list,
  listCustomer,
  listProvider,
  getOne,
  update,
  cancel,
};
