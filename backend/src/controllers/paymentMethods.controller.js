const paymentMethodsService = require("../services/paymentMethods.service");
const { ok, created } = require("../utils/apiResponse");
const { asyncHandler } = require("../utils/asyncHandler");

const list = asyncHandler(async (req, res) => {
  const rows = await paymentMethodsService.listMyPaymentMethods(req.user);
  return ok(res, rows);
});

const create = asyncHandler(async (req, res) => {
  const row = await paymentMethodsService.createPaymentMethod(req.user, req.body);
  return created(res, row, "Карт хадгалагдлаа");
});

const setDefault = asyncHandler(async (req, res) => {
  const row = await paymentMethodsService.setDefaultPaymentMethod(req.user, req.validatedParams.id);
  return ok(res, row, "Үндсэн карт тохирууллаа");
});

const remove = asyncHandler(async (req, res) => {
  await paymentMethodsService.deletePaymentMethod(req.user, req.validatedParams.id);
  return ok(res, { deleted: true }, "Карт устгагдлаа");
});

module.exports = { list, create, setDefault, remove };
