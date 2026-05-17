const chatService = require("../services/chat.service");
const { ok, created, okPaginated } = require("../utils/apiResponse");
const { asyncHandler } = require("../utils/asyncHandler");

const createConversation = asyncHandler(async (req, res) => {
  const row = await chatService.ensureConversation(req.user, req.body);
  return created(res, row, "Яриа үүслээ.");
});

const listConversations = asyncHandler(async (req, res) => {
  const q = req.validatedQuery;
  const { items, total } = await chatService.listConversations(req.user, q);
  return okPaginated(res, { items, total, page: q.page, pageSize: q.pageSize }, "Ярианы жагсаалт.");
});

const listMessages = asyncHandler(async (req, res) => {
  const q = req.validatedQuery;
  const { items, total } = await chatService.listMessages(req.validatedParams.id, req.user, q);
  return okPaginated(res, { items, total, page: q.page, pageSize: q.pageSize }, "Мессежийн жагсаалт.");
});

const sendMessage = asyncHandler(async (req, res) => {
  const row = await chatService.sendMessage(req.validatedParams.id, req.user.id, req.body);
  return created(res, row, "Илгээгдлээ");
});

const markRead = asyncHandler(async (req, res) => {
  const row = await chatService.markConversationRead(req.validatedParams.id, req.user.id, req.body);
  return ok(res, row, "Уншсан болгосон.");
});

module.exports = {
  createConversation,
  listConversations,
  listMessages,
  sendMessage,
  markRead,
};
