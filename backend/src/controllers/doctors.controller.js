const doctorsService = require("../services/doctors.service");
const doctorReviewsService = require("../services/doctorReviews.service");
const { ok, created, okPaginated } = require("../utils/apiResponse");
const { buildMeta } = require("../utils/listQuery");
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

const listFeatured = asyncHandler(async (req, res) => {
  const q = req.validatedQuery;
  const items = await doctorsService.listFeaturedDoctors(q);
  return ok(res, { items });
});

const getOne = asyncHandler(async (req, res) => {
  const row = await doctorsService.getDoctorById(req.validatedParams.id);
  return ok(res, row);
});

const listReviews = asyncHandler(async (req, res) => {
  const doctorId = req.validatedParams.id;
  const q = req.validatedQuery;
  const { summary, items, total } = await doctorReviewsService.listDoctorReviews(doctorId, q);
  const viewer = await doctorReviewsService.getViewerReviewState(doctorId, req.user ?? null);
  const meta = buildMeta({ total: Number(total) || 0, page: q.page, pageSize: q.pageSize });
  return ok(res, { items, meta, summary, viewer });
});

const createReview = asyncHandler(async (req, res) => {
  const doctorId = req.validatedParams.id;
  const result = await doctorReviewsService.createDoctorReview(doctorId, req.user.id, req.body);
  return created(res, result, "Үнэлгээ хадгалагдлаа");
});

const update = asyncHandler(async (req, res) => {
  const row = await doctorsService.updateDoctor(req.validatedParams.id, req.user.id, req.body);
  return ok(res, row, "Шинэчлэгдлээ");
});

module.exports = { create, list, listFeatured, getOne, listReviews, createReview, update };
