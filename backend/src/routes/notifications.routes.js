const express = require("express");
const notificationsController = require("../controllers/notifications.controller");
const { requireAuth } = require("../middleware/auth");
const { validateBody, validateQuery, validateParams } = require("../middleware/validate");
const { validateNotificationsListQuery } = require("../validators/listQuery.validators");
const { validateIdParam, validatePositiveIntParam } = require("../validators/params.validators");
const { validatePushTokenBody } = require("../validators/notifications.validators");

const router = express.Router();

const idParam = validateParams(validateIdParam("id"));

router.get("/me/unread-count", requireAuth, notificationsController.unreadCount);
router.patch("/me/read-all", requireAuth, notificationsController.markAllRead);
router.post("/push-token", requireAuth, validateBody(validatePushTokenBody), notificationsController.registerPushToken);
router.get("/me", requireAuth, validateQuery(validateNotificationsListQuery), notificationsController.listMine);
router.patch("/:id/read", requireAuth, idParam, notificationsController.markRead);
router.get(
  "/:userId",
  requireAuth,
  validateParams(validatePositiveIntParam("userId", "user_id")),
  validateQuery(validateNotificationsListQuery),
  notificationsController.listForUserLegacy,
);

module.exports = router;
