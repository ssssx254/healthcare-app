import type { ChatConversation, ChatMessage } from "@/types/healthcare";

type ConversationSeed = {
  customerId: string;
  customerName: string;
  providerId: string;
  providerName: string;
  providerTitle?: string;
};

const listeners = new Set<() => void>();
let conversations: ChatConversation[] = [];

function emit() {
  listeners.forEach((l) => l());
}

function nowIso() {
  return new Date().toISOString();
}

function makeSystemMessage(conversationId: string, text: string): ChatMessage {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    conversationId,
    senderRole: "system",
    senderId: "system",
    senderName: "Систем",
    text,
    sentAtIso: nowIso(),
  };
}

function createConversation(seed: ConversationSeed): ChatConversation {
  const id = `conv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const intro = makeSystemMessage(id, "Зөвлөгөөний чат эхэллээ. Эмч удахгүй хариу өгнө.");
  return {
    id,
    customer: { id: seed.customerId, name: seed.customerName },
    provider: { id: seed.providerId, name: seed.providerName },
    providerTitle: seed.providerTitle ?? "Эмч",
    providerPresence: "online",
    messages: [intro],
    unreadForCustomer: 0,
    unreadForProvider: 1,
    updatedAtIso: intro.sentAtIso,
  };
}

export function subscribeChatStore(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getChatSnapshot(): ChatConversation[] {
  return conversations;
}

export function ensureCustomerConversation(seed: ConversationSeed): ChatConversation {
  const existing = conversations.find((c) => c.customer.id === seed.customerId && c.provider.id === seed.providerId);
  if (existing) return existing;
  const next = createConversation(seed);
  conversations = [next, ...conversations];
  emit();
  return next;
}

export function sendConversationMessage(params: {
  conversationId: string;
  senderRole: "customer" | "provider";
  senderId: string;
  senderName: string;
  text: string;
}) {
  const clean = params.text.trim();
  if (!clean) return;
  conversations = conversations.map((c) => {
    if (c.id !== params.conversationId) return c;
    const msg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      conversationId: c.id,
      senderRole: params.senderRole,
      senderId: params.senderId,
      senderName: params.senderName,
      text: clean,
      sentAtIso: nowIso(),
    };
    return {
      ...c,
      messages: [...c.messages, msg],
      unreadForCustomer: params.senderRole === "provider" ? c.unreadForCustomer + 1 : c.unreadForCustomer,
      unreadForProvider: params.senderRole === "customer" ? c.unreadForProvider + 1 : c.unreadForProvider,
      updatedAtIso: msg.sentAtIso,
    };
  });
  conversations = [...conversations].sort((a, b) => b.updatedAtIso.localeCompare(a.updatedAtIso));
  emit();
}

export function markConversationRead(conversationId: string, role: "customer" | "provider") {
  conversations = conversations.map((c) => {
    if (c.id !== conversationId) return c;
    return role === "customer" ? { ...c, unreadForCustomer: 0 } : { ...c, unreadForProvider: 0 };
  });
  emit();
}

export function setProviderPresence(conversationId: string, presence: "online" | "offline") {
  conversations = conversations.map((c) => (c.id === conversationId ? { ...c, providerPresence: presence } : c));
  emit();
}

