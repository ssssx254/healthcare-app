const medicalServices = require("../services/medicalServices.service");
const { ok, created, okPaginated } = require("../utils/apiResponse");
const { asyncHandler } = require("../utils/asyncHandler");

const create = asyncHandler(async (req, res) => {
  const row = await medicalServices.createService(req.user.id, req.body);
  return created(res, row, "Үйлчилгээ нэмэгдлээ");
});

const list = asyncHandler(async (req, res) => {
  const q = req.validatedQuery;
  const { items, total } = await medicalServices.listServices(q);
  return okPaginated(res, { items, total, page: q.page, pageSize: q.pageSize });
});

const getOne = asyncHandler(async (req, res) => {
  const row = await medicalServices.getServiceById(req.validatedParams.id);
  return ok(res, row);
});

const update = asyncHandler(async (req, res) => {
  const row = await medicalServices.updateService(req.validatedParams.id, req.user.id, req.body);
  return ok(res, row, "Шинэчлэгдлээ");
});

const remove = asyncHandler(async (req, res) => {
  const row = await medicalServices.deleteService(req.validatedParams.id, req.user.id);
  return ok(res, row, "Үйлчилгээ устгагдлаа");
});

module.exports = { create, list, getOne, update, remove };
