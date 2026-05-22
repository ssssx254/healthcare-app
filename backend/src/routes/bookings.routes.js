const express = require("express");
const bookingsController = require("../controllers/bookings.controller");
const { requireAuth, requireRole } = require("../middleware/auth");
const { validateBody, validateQuery, validateParams } = require("../middleware/validate");
const { validateBookingsListQuery } = require("../validators/listQuery.validators");
const { validateBookingCreateBody, validateBookingStatusUpdateBody } = require("../validators/bookings.validators");
const { validateIdParam } = require("../validators/params.validators");

const router = express.Router();

const idParam = validateParams(validateIdParam("id"));

router.put(
  "/:id/payment",
  requireAuth,
  requireRole("customer"),
  idParam,
  bookingsController.markPaid,
);
router.put(
  "/:id/status",
  requireAuth,
  idParam,
  validateBody(validateBookingStatusUpdateBody),
  bookingsController.updateStatus,
);
router.patch("/:id/cancel", requireAuth, idParam, bookingsController.cancel);
router.get(
  "/customer",
  requireAuth,
  requireRole("customer"),
  validateQuery(validateBookingsListQuery),
  bookingsController.listCustomer,
);
router.get(
  "/provider",
  requireAuth,
  requireRole("provider"),
  validateQuery(validateBookingsListQuery),
  bookingsController.listProvider,
);
router.get("/", requireAuth, validateQuery(validateBookingsListQuery), bookingsController.list);
router.get("/:id/lab-tests", requireAuth, idParam, bookingsController.listSharedLabTests);
router.get("/:id", requireAuth, idParam, bookingsController.getOne);
router.post(
  "/",
  requireAuth,
  requireRole("customer"),
  validateBody(validateBookingCreateBody),
  bookingsController.create,
);

module.exports = router;
