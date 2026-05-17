const express = require("express");
const chatController = require("../controllers/chat.controller");
const { requireAuth, requireRole } = require("../middleware/auth");
const { validateBody, validateParams, validateQuery } = require("../middleware/validate");
const { validateIdParam } = require("../validators/params.validators");
const {
  validateCreateConversationBody,
  validateListConversationsQuery,
  validateListMessagesQuery,
  validateSendMessageBody,
  validateMarkReadBody,
} = require("../validators/chat.validators");

const router = express.Router();

router.use(requireAuth, requireRole("customer", "provider"));

router.post("/conversations", validateBody(validateCreateConversationBody), chatController.createConversation);
router.post("/conversations/ensure", validateBody(validateCreateConversationBody), chatController.createConversation);
router.get("/conversations", validateQuery(validateListConversationsQuery), chatController.listConversations);
router.get(
  "/conversations/:id/messages",
  validateParams(validateIdParam("id")),
  validateQuery(validateListMessagesQuery),
  chatController.listMessages,
);
router.post(
  "/conversations/:id/messages",
  validateParams(validateIdParam("id")),
  validateBody(validateSendMessageBody),
  chatController.sendMessage,
);
router.post(
  "/conversations/:id/read",
  validateParams(validateIdParam("id")),
  validateBody(validateMarkReadBody),
  chatController.markRead,
);
router.patch(
  "/conversations/:id/read",
  validateParams(validateIdParam("id")),
  validateBody(validateMarkReadBody),
  chatController.markRead,
);

module.exports = router;
