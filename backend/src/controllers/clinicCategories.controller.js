const clinicCategories = require("../services/clinicCategories.service");
const { ok, created } = require("../utils/apiResponse");
const { asyncHandler } = require("../utils/asyncHandler");

const listPublic = asyncHandler(async (_req, res) => {
  const names = await clinicCategories.listPublicCategoryNames();
  return ok(res, { items: names });
});

const listForClinic = asyncHandler(async (req, res) => {
  const items = await clinicCategories.listClinicCategories(req.validatedParams.id);
  return ok(res, { items });
});

const createForClinic = asyncHandler(async (req, res) => {
  const row = await clinicCategories.addClinicCategory(
    req.validatedParams.id,
    req.user.id,
    req.body.name,
  );
  return created(res, row, "Ангилал нэмэгдлээ");
});

const removeForClinic = asyncHandler(async (req, res) => {
  const row = await clinicCategories.removeClinicCategory(
    req.validatedParams.id,
    req.validatedParams.categoryId,
    req.user.id,
  );
  return ok(res, row, "Ангилал устгагдлаа");
});

module.exports = { listPublic, listForClinic, createForClinic, removeForClinic };
