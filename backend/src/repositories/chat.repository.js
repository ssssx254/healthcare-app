const { pool } = require("../config/database");

async function findConversationByClinicCustomerProvider(clinicId, customerUserId, providerUserId) {
  const [rows] = await pool.execute(
    `SELECT * FROM chat_conversations
     WHERE clinic_id = ? AND customer_user_id = ? AND provider_user_id = ?
     LIMIT 1`,
    [clinicId, customerUserId, providerUserId],
  );
  return rows[0] || null;
}

async function insertConversationOnly(conn, { clinic_id, customer_user_id, provider_user_id }) {
  const c = conn || pool;
  const [r] = await c.execute(
    `INSERT INTO chat_conversations (clinic_id, customer_user_id, provider_user_id)
     VALUES (?, ?, ?)`,
    [clinic_id, customer_user_id, provider_user_id],
  );
  return r.insertId;
}

async function seedParticipantReads(conn, conversationId, customerUserId, providerUserId) {
  const c = conn || pool;
  await c.execute(
    `INSERT INTO chat_participant_reads (conversation_id, user_id, last_read_message_id) VALUES (?, ?, 0), (?, ?, 0)`,
    [conversationId, customerUserId, conversationId, providerUserId],
  );
}

async function getConversationById(id) {
  const [rows] = await pool.execute(`SELECT * FROM chat_conversations WHERE id = ? LIMIT 1`, [id]);
  return rows[0] || null;
}

async function updateConversationLastMessage(conn, conversationId, preview, senderUserId) {
  const c = conn || pool;
  await c.execute(
    `UPDATE chat_conversations
     SET last_message_at = CURRENT_TIMESTAMP, last_message_preview = ?, last_message_sender_id = ?
     WHERE id = ?`,
    [preview.slice(0, 500), senderUserId, conversationId],
  );
}

async function insertMessage(conn, { conversation_id, sender_user_id, body }) {
  const c = conn || pool;
  const [r] = await c.execute(
    `INSERT INTO chat_messages (conversation_id, sender_user_id, body) VALUES (?, ?, ?)`,
    [conversation_id, sender_user_id, body],
  );
  const [rows] = await c.execute(`SELECT * FROM chat_messages WHERE id = ? LIMIT 1`, [r.insertId]);
  return rows[0];
}

async function listMessages(conversationId, { limit = 50, before_id } = {}) {
  const lim = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const params = [conversationId];
  let sql = `SELECT m.*, u.full_name AS sender_full_name
             FROM chat_messages m
             INNER JOIN users u ON u.id = m.sender_user_id
             WHERE m.conversation_id = ?`;
  if (before_id) {
    sql += ` AND m.id < ?`;
    params.push(Number(before_id));
  }
  sql += ` ORDER BY m.id DESC LIMIT ?`;
  params.push(lim);
  const [rows] = await pool.execute(sql, params);
  return rows.reverse();
}

async function countMessagesInConversation(conversationId) {
  const [rows] = await pool.execute(`SELECT COUNT(*) AS c FROM chat_messages WHERE conversation_id = ?`, [conversationId]);
  return Number(rows[0]?.c || 0);
}

async function listMessagesPaged(conversationId, { pageSize, offset } = {}) {
  const lim = Math.min(Math.max(Number(pageSize) || 50, 1), 100);
  const off = Math.max(0, Number(offset) || 0);
  const [rows] = await pool.execute(
    `SELECT m.*, u.full_name AS sender_full_name
     FROM chat_messages m
     INNER JOIN users u ON u.id = m.sender_user_id
     WHERE m.conversation_id = ?
     ORDER BY m.id DESC
     LIMIT ${lim} OFFSET ${off}`,
    [conversationId],
  );
  return rows.reverse();
}

async function getParticipantRead(conversationId, userId) {
  const [rows] = await pool.execute(
    `SELECT * FROM chat_participant_reads WHERE conversation_id = ? AND user_id = ? LIMIT 1`,
    [conversationId, userId],
  );
  return rows[0] || null;
}

async function setParticipantLastRead(conn, conversationId, userId, lastReadMessageId) {
  const c = conn || pool;
  await c.execute(
    `INSERT INTO chat_participant_reads (conversation_id, user_id, last_read_message_id)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE last_read_message_id = GREATEST(last_read_message_id, VALUES(last_read_message_id)), updated_at = CURRENT_TIMESTAMP`,
    [conversationId, userId, lastReadMessageId],
  );
}

async function maxMessageIdInConversation(conn, conversationId) {
  const c = conn || pool;
  const [rows] = await c.execute(
    `SELECT COALESCE(MAX(id), 0) AS mid FROM chat_messages WHERE conversation_id = ?`,
    [conversationId],
  );
  return Number(rows[0]?.mid || 0);
}

async function listConversationsWithUnreadForUser(viewerUserId) {
  const [rows] = await pool.execute(
    `SELECT c.*,
      cu.full_name AS customer_full_name,
      pu.full_name AS provider_full_name,
      cl.clinic_name,
      (SELECT COUNT(*) FROM chat_messages m
        WHERE m.conversation_id = c.id
        AND m.sender_user_id <> ?
        AND m.id > COALESCE(
          (SELECT pr.last_read_message_id FROM chat_participant_reads pr
           WHERE pr.conversation_id = c.id AND pr.user_id = ? LIMIT 1),
          0
        )
      ) AS unread_count
     FROM chat_conversations c
     INNER JOIN users cu ON cu.id = c.customer_user_id
     INNER JOIN users pu ON pu.id = c.provider_user_id
     INNER JOIN clinics cl ON cl.id = c.clinic_id
     WHERE c.customer_user_id = ? OR c.provider_user_id = ?
     ORDER BY COALESCE(c.last_message_at, c.updated_at) DESC, c.id DESC`,
    [viewerUserId, viewerUserId, viewerUserId, viewerUserId],
  );
  return rows;
}

async function countConversationsForUser(viewerUserId) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS c
     FROM chat_conversations c
     WHERE c.customer_user_id = ? OR c.provider_user_id = ?`,
    [viewerUserId, viewerUserId],
  );
  return Number(rows[0]?.c || 0);
}

async function listConversationsWithUnreadForUserPaged(viewerUserId, { pageSize, offset } = {}) {
  const lim = Math.min(Math.max(Number(pageSize) || 20, 1), 100);
  const off = Math.max(0, Number(offset) || 0);
  const [rows] = await pool.execute(
    `SELECT c.*,
      cu.full_name AS customer_full_name,
      pu.full_name AS provider_full_name,
      cl.clinic_name,
      (SELECT COUNT(*) FROM chat_messages m
        WHERE m.conversation_id = c.id
        AND m.sender_user_id <> ?
        AND m.id > COALESCE(
          (SELECT pr.last_read_message_id FROM chat_participant_reads pr
           WHERE pr.conversation_id = c.id AND pr.user_id = ? LIMIT 1),
          0
        )
      ) AS unread_count
     FROM chat_conversations c
     INNER JOIN users cu ON cu.id = c.customer_user_id
     INNER JOIN users pu ON pu.id = c.provider_user_id
     INNER JOIN clinics cl ON cl.id = c.clinic_id
     WHERE c.customer_user_id = ? OR c.provider_user_id = ?
     ORDER BY COALESCE(c.last_message_at, c.updated_at) DESC, c.id DESC
     LIMIT ${lim} OFFSET ${off}`,
    [viewerUserId, viewerUserId, viewerUserId, viewerUserId],
  );
  return rows;
}

module.exports = {
  findConversationByClinicCustomerProvider,
  insertConversationOnly,
  seedParticipantReads,
  getConversationById,
  updateConversationLastMessage,
  insertMessage,
  listMessages,
  countMessagesInConversation,
  listMessagesPaged,
  getParticipantRead,
  setParticipantLastRead,
  maxMessageIdInConversation,
  listConversationsWithUnreadForUser,
  countConversationsForUser,
  listConversationsWithUnreadForUserPaged,
};
