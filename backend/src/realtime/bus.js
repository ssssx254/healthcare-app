const { EventEmitter } = require("events");

/**
 * Ирээдүйд WebSocket / SSE bridge холбох EventEmitter-ууд.
 * Одоо: domain event-уудыг publish хийнэ (лог, queue, ws broadcast-д бэлэн).
 */
const chatBus = new EventEmitter();
chatBus.setMaxListeners(50);

const notificationBus = new EventEmitter();
notificationBus.setMaxListeners(50);

module.exports = { chatBus, notificationBus };
