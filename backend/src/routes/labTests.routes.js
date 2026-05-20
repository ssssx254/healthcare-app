const express = require("express");
const labTestsController = require("../controllers/labTests.controller");
const { requireAuth, requireRole, requireApprovedProvider } = require("../middleware/auth");
const { ROLES } = require("../constants/roles");
const { validateQuery, validateParams, validateBody } = require("../middleware/validate");
const { validateIdParam } = require("../validators/params.validators");
const {
  validateCustomerListQuery,
  validateProviderListQuery,
  validateCreateCustomerBody,
  validateUpdateProviderBody,
  validateCreateProviderBody,
} = require("../validators/labTests.validators");

const router = express.Router();
const idParam = validateParams(validateIdParam("id"));

router.get("/my", requireAuth, requireRole(ROLES.CUSTOMER), validateQuery(validateCustomerListQuery), labTestsController.listMine);
router.post(
  "/my",
  requireAuth,
  requireRole(ROLES.CUSTOMER),
  validateBody(validateCreateCustomerBody),
  labTestsController.createMine,
);
router.get(
  "/my/:id",
  requireAuth,
  requireRole(ROLES.CUSTOMER),
  idParam,
  labTestsController.getMineById,
);

router.get(
  "/",
  requireAuth,
  requireApprovedProvider,
  validateQuery(validateProviderListQuery),
  labTestsController.listForProvider,
);
router.post(
  "/",
  requireAuth,
  requireApprovedProvider,
  validateBody(validateCreateProviderBody),
  labTestsController.createForProvider,
);
router.get(
  "/:id",
  requireAuth,
  requireApprovedProvider,
  idParam,
  labTestsController.getForProvider,
);
router.patch(
  "/:id",
  requireAuth,
  requireApprovedProvider,
  idParam,
  validateBody(validateUpdateProviderBody),
  labTestsController.updateForProvider,
);

module.exports = router;
