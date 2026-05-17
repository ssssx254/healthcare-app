const express = require("express");
const scheduleSlotsController = require("../controllers/scheduleSlots.controller");
const { requireAuth, requireApprovedProvider } = require("../middleware/auth");
const { validateQuery, validateParams } = require("../middleware/validate");
const {
  validateScheduleSlotsListQuery,
  validateScheduleSlotsAvailableListQuery,
} = require("../validators/listQuery.validators");
const { validateIdParam, validatePositiveIntParam } = require("../validators/params.validators");

const router = express.Router();

const idParam = validateParams(validateIdParam("id"));

router.get("/available", validateQuery(validateScheduleSlotsAvailableListQuery), scheduleSlotsController.listAvailableForCustomer);
router.get("/", validateQuery(validateScheduleSlotsListQuery), scheduleSlotsController.list);
router.post("/", requireAuth, requireApprovedProvider, scheduleSlotsController.create);
router.post("/generate", requireAuth, requireApprovedProvider, scheduleSlotsController.generateSlots);
router.put(
  "/weekly/:doctorId",
  requireAuth,
  requireApprovedProvider,
  validateParams(validatePositiveIntParam("doctorId", "doctor_id")),
  scheduleSlotsController.saveWeeklySchedule,
);
router.put("/:id", requireAuth, requireApprovedProvider, idParam, scheduleSlotsController.update);
router.patch("/:id/block", requireAuth, requireApprovedProvider, idParam, scheduleSlotsController.blockSlot);
router.patch(
  "/:id/unavailable",
  requireAuth,
  requireApprovedProvider,
  idParam,
  scheduleSlotsController.markUnavailable,
);

module.exports = router;
