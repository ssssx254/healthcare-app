const clinicsService = require("../services/clinics.service");
const { ok, created, okPaginated } = require("../utils/apiResponse");
const { asyncHandler } = require("../utils/asyncHandler");

const create = asyncHandler(async (req, res) => {
  const row = await clinicsService.createClinic(req.user.id, req.body);
  return created(res, row, "Эмнэлэг бүртгэгдлээ");
});

const list = asyncHandler(async (req, res) => {
  const q = req.validatedQuery;
  const { items, total } = await clinicsService.listPublicClinics(q);
  return okPaginated(res, { items, total, page: q.page, pageSize: q.pageSize });
});

const getOne = asyncHandler(async (req, res) => {
  const row = await clinicsService.getClinicById(req.validatedParams.id, { restrictToApproved: true });
  return ok(res, row);
});

const getByProvider = asyncHandler(async (req, res) => {
  const row = await clinicsService.getClinicByProvider(req.validatedParams.providerUserId);
  return ok(res, row);
});

const update = asyncHandler(async (req, res) => {
  const row = await clinicsService.updateClinic(req.validatedParams.id, req.user.id, req.body);
  return ok(res, row, "Шинэчлэгдлээ");
});

module.exports = { create, list, getOne, getByProvider, update };
