const express = require("express");
const paymentMethodsController = require("../controllers/paymentMethods.controller");
const { requireAuth, requireRole } = require("../middleware/auth");
const { validateBody, validateParams } = require("../middleware/validate");
const {
  validateCreatePaymentMethodBody,
  validateIdParam,
} = require("../validators/paymentMethods.validators");

const router = express.Router();
const idParam = validateParams(validateIdParam);

router.get("/", requireAuth, requireRole("customer"), paymentMethodsController.list);
router.post(
  "/",
  requireAuth,
  requireRole("customer"),
  validateBody(validateCreatePaymentMethodBody),
  paymentMethodsController.create,
);
router.patch(
  "/:id/default",
  requireAuth,
  requireRole("customer"),
  idParam,
  paymentMethodsController.setDefault,
);
router.delete("/:id", requireAuth, requireRole("customer"), idParam, paymentMethodsController.remove);

module.exports = router;
