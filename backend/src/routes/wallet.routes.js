const express = require("express");
const walletController = require("../controllers/wallet.controller");
const paymentMethodsController = require("../controllers/paymentMethods.controller");
const { requireAuth, requireRole } = require("../middleware/auth");
const { validateBody, validateQuery } = require("../middleware/validate");
const { validateCreatePaymentMethodBody } = require("../validators/paymentMethods.validators");
const { validateWalletTransactionsQuery } = require("../validators/listQuery.validators");
const {
  validatePayBookingBody,
  validateQpayInvoiceBody,
  validateQpayConfirmBody,
  validateQpayBookingInvoiceBody,
} = require("../validators/wallet.validators");

const router = express.Router();

router.get("/balance", requireAuth, requireRole("customer"), walletController.balance);
router.post("/top-up", requireAuth, requireRole("customer"), walletController.topUp);
router.post(
  "/qpay/invoice",
  requireAuth,
  requireRole("customer"),
  validateBody(validateQpayInvoiceBody),
  walletController.qpayInvoice,
);
router.post(
  "/qpay/confirm",
  requireAuth,
  requireRole("customer"),
  validateBody(validateQpayConfirmBody),
  walletController.qpayConfirm,
);
router.get(
  "/transactions",
  requireAuth,
  requireRole("customer"),
  validateQuery(validateWalletTransactionsQuery),
  walletController.transactions,
);
/** Хуучин зам — шинэ `payment_methods` API-тай ижил (compat). */
router.get("/payment-methods", requireAuth, requireRole("customer"), paymentMethodsController.list);
router.post(
  "/payment-methods",
  requireAuth,
  requireRole("customer"),
  validateBody(validateCreatePaymentMethodBody),
  paymentMethodsController.create,
);
router.post(
  "/pay-booking",
  requireAuth,
  requireRole("customer"),
  validateBody(validatePayBookingBody),
  walletController.payBooking,
);
router.post(
  "/qpay/booking-invoice",
  requireAuth,
  requireRole("customer"),
  validateBody(validateQpayBookingInvoiceBody),
  walletController.qpayBookingInvoice,
);
router.post(
  "/qpay/booking-confirm",
  requireAuth,
  requireRole("customer"),
  validateBody(validateQpayConfirmBody),
  walletController.qpayBookingConfirm,
);

module.exports = router;
