const { pool } = require("../config/database");
const { AppError } = require("../utils/appError");
const { assertPositiveIntId, isNonEmptyString, optionalTrimmedString } = require("../utils/validation");
const chatRepo = require("../repositories/chat.repository");
const { chatBus } = require("../realtime/bus");

async function assertClinicOwnedByProvider(clinicId, providerUserId) {
  const [rows] = await pool.execute(`SELECT id FROM clinics WHERE id = ? AND owner_user_id = ? LIMIT 1`, [
    clinicId,
    providerUserId,
  ]);
  if (!rows[0]) {
    throw new AppError(403, "Энэ эмнэлгийн эрхгүй.");
  }
}

async function assertConversationMember(conversationId, userId) {
  const conv = await chatRepo.getConversationById(conversationId);
  if (!conv) throw new AppError(404, "Яриа олдсонгүй.");
  if (Number(conv.customer_user_id) !== userId && Number(conv.provider_user_id) !== userId) {
    throw new AppError(403, "Энэ чатад хандах эрхгүй.");
  }
  return conv;
}

/**
 * Үйлчлүүлэгч: { clinic_id } — эмнэлгийн эзэнтэй яриа үүсгэх/олох.
 * Эмнэлэг: { customer_user_id, clinic_id } — баталгаажсан provider.
 */
async function ensureConversation(user, body) {
  const clinicId = assertPositiveIntId(body.clinic_id, "clinic_id");

  if (user.role === "customer") {
    const customerUserId = user.id;
    const [rows] = await pool.execute(`SELECT owner_user_id FROM clinics WHERE id = ? LIMIT 1`, [clinicId]);
    const providerUserId = rows[0]?.owner_user_id;
    if (!providerUserId) throw new AppError(404, "Эмнэлэг олдсонгүй.");
    if (Number(providerUserId) === customerUserId) {
      throw new AppError(400, "Өөртэйгээ чатлах боломжгүй.");
    }
    let conv = await chatRepo.findConversationByClinicCustomerProvider(clinicId, customerUserId, providerUserId);
    if (conv) return mapConversationRow(conv);
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const id = await chatRepo.insertConversationOnly(conn, {
        clinic_id: clinicId,
        customer_user_id: customerUserId,
        provider_user_id: providerUserId,
      });
      await chatRepo.seedParticipantReads(conn, id, customerUserId, providerUserId);
      await conn.commit();
      const created = await chatRepo.getConversationById(id);
      return mapConversationRow(created);
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }

  if (user.role === "provider") {
    const customerUserId = assertPositiveIntId(body.customer_user_id, "customer_user_id");
    await assertClinicOwnedByProvider(clinicId, user.id);
    const providerUserId = user.id;
    let conv = await chatRepo.findConversationByClinicCustomerProvider(clinicId, customerUserId, providerUserId);
    if (conv) return mapConversationRow(conv);
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const id = await chatRepo.insertConversationOnly(conn, {
        clinic_id: clinicId,
        customer_user_id: customerUserId,
        provider_user_id: providerUserId,
      });
      await chatRepo.seedParticipantReads(conn, id, customerUserId, providerUserId);
      await conn.commit();
      const created = await chatRepo.getConversationById(id);
      return mapConversationRow(created);
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }

  throw new AppError(403, "Чат үүсгэх эрхгүй.");
}

function mapConversationRow(row) {
  return {
    id: Number(row.id),
    customerId: Number(row.customer_user_id),
    providerId: Number(row.provider_user_id),
    lastMessage: row.last_message_preview || "",
    unreadCount: Number(row.unread_count || 0),
    updatedAt: row.last_message_at || row.updated_at || row.created_at,
  };
}

function mapMessageRow(row, conversation, lastReadMessageId, viewerUserId) {
  const senderRole = Number(row.sender_user_id) === Number(conversation.customer_user_id) ? "customer" : "provider";
  const isRead =
    Number(row.sender_user_id) === Number(viewerUserId) || Number(row.id) <= Number(lastReadMessageId || 0);
  return {
    id: Number(row.id),
    conversationId: Number(row.conversation_id),
    senderId: Number(row.sender_user_id),
    senderRole,
    message: row.body,
    createdAt: row.created_at,
    isRead,
  };
}

async function listConversations(user, q) {
  if (!["customer", "provider"].includes(user.role)) {
    throw new AppError(403, "Чатын жагсаалтыг харах эрхгүй.");
  }
  const total = await chatRepo.countConversationsForUser(user.id);
  const rows = await chatRepo.listConversationsWithUnreadForUserPaged(user.id, q);
  return { items: rows.map(mapConversationRow), total };
}

async function listMessages(conversationId, user, q) {
  assertPositiveIntId(conversationId, "conversation_id");
  const conversation = await assertConversationMember(conversationId, user.id);
  const total = await chatRepo.countMessagesInConversation(conversationId);
  const rows = await chatRepo.listMessagesPaged(conversationId, q);
  const read = await chatRepo.getParticipantRead(conversationId, user.id);
  const items = rows.map((r) => mapMessageRow(r, conversation, read?.last_read_message_id ?? 0, user.id));
  return { items, total };
}

async function sendMessage(conversationId, senderUserId, body) {
  assertPositiveIntId(conversationId, "conversation_id");
  await assertConversationMember(conversationId, senderUserId);
  const text = optionalTrimmedString(body.message ?? body.body, 8000);
  if (!isNonEmptyString(text)) {
    throw new AppError(400, "Мессежийн агуулга оруулна уу.");
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const msg = await chatRepo.insertMessage(conn, {
      conversation_id: conversationId,
      sender_user_id: senderUserId,
      body: text.trim(),
    });
    const preview = text.trim().slice(0, 200);
    await chatRepo.updateConversationLastMessage(conn, conversationId, preview, senderUserId);
    await conn.commit();
    try {
      chatBus.emit("message.created", {
        conversationId: Number(conversationId),
        message: msg,
      });
    } catch {
      /* ignore */
    }
    const conv = await chatRepo.getConversationById(conversationId);
    return mapMessageRow(msg, conv, 0, senderUserId);
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

async function markConversationRead(conversationId, userId, body = {}) {
  assertPositiveIntId(conversationId, "conversation_id");
  await assertConversationMember(conversationId, userId);
  let upTo = body.up_to_message_id;
  if (upTo !== undefined && upTo !== null && upTo !== "") {
    upTo = assertPositiveIntId(upTo, "up_to_message_id");
  } else {
    upTo = await chatRepo.maxMessageIdInConversation(null, conversationId);
  }
  await chatRepo.setParticipantLastRead(null, conversationId, userId, upTo);
  return { conversationId: Number(conversationId), lastReadMessageId: upTo };
}

module.exports = {
  ensureConversation,
  listConversations,
  listMessages,
  sendMessage,
  markConversationRead,
};
