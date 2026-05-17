const { AppError } = require("../utils/appError");
const { assertPositiveIntId } = require("../utils/validation");
const notificationsRepo = require("../repositories/notifications.repository");
const { notificationBus } = require("../realtime/bus");
const { pool } = require("../config/database");

/**
 * Мэдэгдэл үүсгэж DB-д хадгална; ирээдүйд WebSocket push-д `notificationBus` ашиглана.
 */
async function createNotification(payload) {
  const row = await notificationsRepo.insertNotification(payload);
  try {
    notificationBus.emit("notification.created", { notification: row });
  } catch {
    /* ignore emitter errors */
  }
  return row;
}

async function listMine(userId, listQuery) {
  const filters = { is_read: listQuery.is_read, type: listQuery.type };
  const total = await notificationsRepo.countNotificationsForUser(userId, filters);
  const items = await notificationsRepo.listNotificationsForUser(userId, {
    ...filters,
    pageSize: listQuery.pageSize,
    offset: listQuery.offset,
  });
  return { items, total };
}

async function getUnreadCount(userId) {
  const n = await notificationsRepo.countUnreadForUser(userId);
  return { unread_count: n };
}

async function markRead(notificationId, userId) {
  const id = assertPositiveIntId(notificationId, "notification_id");
  const ok = await notificationsRepo.markNotificationRead(id, userId);
  if (!ok) {
    throw new AppError(404, "Мэдэгдэл олдсонгүй.");
  }
  return { id, is_read: true };
}

async function markAllRead(userId) {
  await notificationsRepo.markAllNotificationsRead(userId);
  return { marked_all: true };
}

async function registerPushToken(userId, body) {
  const token = String(body.expo_push_token).trim();
  await pool.execute(`UPDATE users SET expo_push_token = ? WHERE id = ?`, [token, userId]);
  return { saved: true, expo_push_token: token };
}

module.exports = {
  createNotification,
  listMine,
  getUnreadCount,
  markRead,
  markAllRead,
  registerPushToken,
};
