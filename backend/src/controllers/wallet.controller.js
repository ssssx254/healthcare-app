const walletService = require("../services/wallet.service");
const { ok, created, okPaginated } = require("../utils/apiResponse");
const { asyncHandler } = require("../utils/asyncHandler");

const balance = asyncHandler(async (req, res) => {
  const data = await walletService.getWalletBalance(req.user.id);
  return ok(res, data);
});

const topUp = asyncHandler(async (req, res) => {
  const data = await walletService.topUpWallet(req.user, req.body);
  return created(res, data, "Данс цэнэглэгдлээ");
});

const transactions = asyncHandler(async (req, res) => {
  const q = req.validatedQuery;
  const { items, total } = await walletService.listMyTransactions(req.user, q);
  return okPaginated(res, { items, total, page: q.page, pageSize: q.pageSize });
});

const paymentMethodsList = asyncHandler(async (req, res) => {
  const rows = await walletService.listMyPaymentMethods(req.user);
  return ok(res, rows);
});

const paymentMethodsCreate = asyncHandler(async (req, res) => {
  const row = await walletService.addMockPaymentMethod(req.user, req.body);
  return created(res, row, "Төлбөрийн хэрэгсэл нэмэгдлээ");
});

const payBooking = asyncHandler(async (req, res) => {
  const row = await walletService.payBookingFromWallet(req.user.id, req.body.booking_id);
  return ok(res, row, "Төлбөр амжилттай төлөгдлөө");
});

const qpayInvoice = asyncHandler(async (req, res) => {
  const data = walletService.createQpayTopUpInvoice(req.user, req.body);
  return ok(res, data, "QPay нэхэмжлэл үүслээ (жишээ).");
});

const qpayConfirm = asyncHandler(async (req, res) => {
  const data = await walletService.confirmQpayTopUpInvoice(req.user, req.body);
  return ok(res, data, "QPay төлбөр баталгаажлаа.");
});

module.exports = {
  balance,
  topUp,
  transactions,
  paymentMethodsList,
  paymentMethodsCreate,
  payBooking,
  qpayInvoice,
  qpayConfirm,
};
