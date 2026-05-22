const express = require("express");
const consultationsController = require("../controllers/consultations.controller");
const { requireAuth, requireRole, requireApprovedProvider } = require("../middleware/auth");
const { validateBody, validateQuery, validateParams } = require("../middleware/validate");
const { validateConsultationsListQuery } = require("../validators/listQuery.validators");
const { validateConsultationCreateBody, validateConsultationUpdateBody } = require("../validators/consultations.validators");
const { validateIdParam } = require("../validators/params.validators");

const router = express.Router();

const idParam = validateParams(validateIdParam("id"));

router.get("/free-availability", consultationsController.listFreeAvailability);
router.post(
  "/free",
  requireAuth,
  requireRole("customer"),
  validateBody(validateConsultationCreateBody),
  consultationsController.createFree,
);
router.post(
  "/",
  requireAuth,
  requireRole("customer"),
  validateBody(validateConsultationCreateBody),
  consultationsController.create,
);

router.get(
  "/customer",
  requireAuth,
  requireRole("customer"),
  validateQuery(validateConsultationsListQuery),
  consultationsController.listCustomer,
);
router.get(
  "/provider",
  requireAuth,
  requireApprovedProvider,
  validateQuery(validateConsultationsListQuery),
  consultationsController.listProvider,
);
router.get("/", requireAuth, validateQuery(validateConsultationsListQuery), consultationsController.list);

router.patch("/:id/cancel", requireAuth, idParam, consultationsController.cancel);
router.get("/:id", requireAuth, idParam, consultationsController.getOne);
router.put(
  "/:id",
  requireAuth,
  requireApprovedProvider,
  idParam,
  validateBody(validateConsultationUpdateBody),
  consultationsController.update,
);

module.exports = router;
