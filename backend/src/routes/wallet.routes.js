const express = require("express");
const walletController = require("../controllers/wallet.controller");
const { requireAuth, requireRole } = require("../middleware/auth");
const { validateBody, validateQuery } = require("../middleware/validate");
const { validateWalletTransactionsQuery } = require("../validators/listQuery.validators");
const {
  validatePayBookingBody,
  validateQpayInvoiceBody,
  validateQpayConfirmBody,
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
router.get("/payment-methods", requireAuth, requireRole("customer"), walletController.paymentMethodsList);
router.post("/payment-methods", requireAuth, requireRole("customer"), walletController.paymentMethodsCreate);
router.post(
  "/pay-booking",
  requireAuth,
  requireRole("customer"),
  validateBody(validatePayBookingBody),
  walletController.payBooking,
);

module.exports = router;
