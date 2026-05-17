const doctorsService = require("../services/doctors.service");
const { ok, created, okPaginated } = require("../utils/apiResponse");
const { asyncHandler } = require("../utils/asyncHandler");

const create = asyncHandler(async (req, res) => {
  const row = await doctorsService.createDoctor(req.user.id, req.body);
  return created(res, row, "Эмч нэмэгдлээ");
});

const list = asyncHandler(async (req, res) => {
  const q = req.validatedQuery;
  const { items, total } = await doctorsService.listDoctors(q, { admin: false });
  return okPaginated(res, { items, total, page: q.page, pageSize: q.pageSize });
});

const getOne = asyncHandler(async (req, res) => {
  const row = await doctorsService.getDoctorById(req.validatedParams.id);
  return ok(res, row);
});

const update = asyncHandler(async (req, res) => {
  const row = await doctorsService.updateDoctor(req.validatedParams.id, req.user.id, req.body);
  return ok(res, row, "Шинэчлэгдлээ");
});

module.exports = { create, list, getOne, update };
