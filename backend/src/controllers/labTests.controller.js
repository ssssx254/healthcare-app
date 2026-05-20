const labTestsService = require("../services/labTests.service");
const { ok, created } = require("../utils/apiResponse");
const { asyncHandler } = require("../utils/asyncHandler");

const listMine = asyncHandler(async (req, res) => {
  const rows = await labTestsService.listMyLabTests(req.user.id, req.validatedQuery);
  return ok(res, { items: rows });
});

const createMine = asyncHandler(async (req, res) => {
  const row = await labTestsService.createCustomerLabTest(req.user.id, req.body);
  return created(res, row, "Шинжилгээ хадгалагдлаа");
});

const getMineById = asyncHandler(async (req, res) => {
  const row = await labTestsService.getLabTestForCustomer(req.validatedParams.id, req.user.id);
  return ok(res, row);
});

const listForProvider = asyncHandler(async (req, res) => {
  const rows = await labTestsService.listProviderLabTests(req.user.id, req.validatedQuery);
  return ok(res, { items: rows });
});

const createForProvider = asyncHandler(async (req, res) => {
  const row = await labTestsService.createProviderLabTest(req.user.id, req.body);
  return created(res, row, "Шинжилгээний хариу бүртгэгдлээ");
});

const getForProvider = asyncHandler(async (req, res) => {
  const row = await labTestsService.getLabTestForProvider(req.validatedParams.id, req.user.id);
  return ok(res, row);
});

const updateForProvider = asyncHandler(async (req, res) => {
  const row = await labTestsService.updateProviderLabTest(req.user.id, req.validatedParams.id, req.body);
  return ok(res, row, "Шинэчлэгдлээ");
});

module.exports = {
  listMine,
  createMine,
  getMineById,
  listForProvider,
  createForProvider,
  getForProvider,
  updateForProvider,
};
