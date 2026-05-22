import { useAuth } from "@/hooks/useAuth";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { scheduleLocalDemoNotification } from "@/lib/notifications/expoNotifications";
import { chatApi, type ChatConversationRow } from "@/services/api/chatApi";
import type { ChatConversation } from "@/types/healthcare";
import type { User } from "@/types/healthcare/user";
import { useCallback, useEffect, useRef, useState } from "react";

function toIso(v?: string | null): string {
  if (!v) return new Date().toISOString();
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function toRole(senderUserId: number, customerId: number): "customer" | "provider" {
  return senderUserId === customerId ? "customer" : "provider";
}

function mapConversationRow(
  row: ChatConversationRow,
  user: Pick<User, "id" | "role"> | null | undefined,
  isOnline: boolean,
  providerDisplayName?: string,
): ChatConversation {
  const legacy = row as ChatConversationRow & { customerId?: number; providerId?: number };
  const customerId = String(row.customer_user_id ?? legacy.customerId ?? "");
  const providerId = String(row.provider_user_id ?? legacy.providerId ?? "");
  const lastAt = row.last_message_at || row.updated_at || row.created_at;
  const providerName =
    providerDisplayName?.trim() ||
    row.provider_full_name?.trim() ||
    (row.clinic_name ? `${row.clinic_name}` : "") ||
    (providerId ? `Эмнэлэг #${providerId}` : "Эмнэлэг");
  return {
    id: String(row.id),
    customer: { id: customerId, name: row.customer_full_name?.trim() || `Үйлчлүүлэгч #${customerId}` },
    provider: { id: providerId, name: providerName },
    providerTitle: row.clinic_name ? `${row.clinic_name} · Эмнэлгийн баг` : "Эмнэлгийн баг",
    providerPresence: isOnline ? "online" : "offline",
    messages: row.last_message_preview
      ? [
          {
            id: `preview-${row.id}`,
            conversationId: String(row.id),
            senderRole: toRole(Number(row.last_message_sender_id || row.provider_user_id), row.customer_user_id),
            senderId: String(row.last_message_sender_id || ""),
            senderName: "",
            text: row.last_message_preview || row.last_message || "",
            sentAtIso: toIso(lastAt),
          },
        ]
      : [],
    unreadForCustomer: user?.role === "customer" ? Number(row.unread_count || 0) : 0,
    unreadForProvider: user?.role === "provider" ? Number(row.unread_count || 0) : 0,
    updatedAtIso: toIso(lastAt),
  };
}

export function useChatSync() {
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const conversationsRef = useRef<ChatConversation[]>([]);
  const [loadingConversationId, setLoadingConversationId] = useState<string | null>(null);
  const outboxRef = useRef<
    Record<string, { conversationId: string; senderRole: "customer" | "provider"; senderId: string; senderName: string; text: string }>
  >({});
  const notifiedMessageIdsRef = useRef<Set<string>>(new Set());

  const mergeMessages = useCallback(
    (existing: ChatConversation["messages"], incoming: ChatConversation["messages"]): ChatConversation["messages"] => {
      const byId = new Map<string, ChatConversation["messages"][number]>();
      for (const msg of incoming) {
        byId.set(msg.id, { ...msg, deliveryState: "sent" });
      }
      for (const msg of existing) {
        if (msg.deliveryState === "sending" || msg.deliveryState === "failed") {
          const matchedServer = incoming.find(
            (srv) =>
              srv.senderRole === msg.senderRole &&
              srv.text.trim() === msg.text.trim() &&
              Math.abs(new Date(srv.sentAtIso).getTime() - new Date(msg.sentAtIso).getTime()) <= 2 * 60 * 1000,
          );
          if (!matchedServer) {
            byId.set(msg.id, msg);
          }
        }
      }
      return Array.from(byId.values()).sort((a, b) => a.sentAtIso.localeCompare(b.sentAtIso));
    },
    [],
  );

  const refreshConversations = useCallback(async (opts?: { skipCache?: boolean }) => {
    if (!user?.id || (user.role !== "customer" && user.role !== "provider")) {
      setConversations([]);
      return;
    }
    const rows = await chatApi.listConversations({ skipCache: opts?.skipCache });
    const mapped: ChatConversation[] = rows.map((row) => mapConversationRow(row, user, isOnline));
    setConversations((prev) => {
      const merged = mapped.map((next) => {
        const old = prev.find((p) => p.id === next.id);
        if (!old) return next;
        return {
          ...next,
          messages: mergeMessages(old.messages, next.messages),
        };
      });
      const mergedIds = new Set(merged.map((c) => c.id));
      const pendingOnly = prev.filter((p) => !mergedIds.has(p.id));
      return [...pendingOnly, ...merged].sort((a, b) => b.updatedAtIso.localeCompare(a.updatedAtIso));
    });
  }, [isOnline, mergeMessages, user?.id, user?.role]);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    void refreshConversations();
  }, [refreshConversations]);

  const ensureCustomerConversation = useCallback(
    async (params: {
      clinicId: number;
      customerUserId?: number;
      providerUserId?: number;
      providerDisplayName?: string;
    }) => {
      const body =
        user?.role === "provider"
          ? { clinic_id: params.clinicId, customer_user_id: Number(params.customerUserId) }
          : { clinic_id: params.clinicId };
      const row = await chatApi.ensureConversation(body);
      const ensured = mapConversationRow(row, user, isOnline, params.providerDisplayName);
      setConversations((prev) => {
        const rest = prev.filter((c) => c.id !== ensured.id);
        return [ensured, ...rest];
      });
      await refreshConversations({ skipCache: true });
      return String(row.id);
    },
    [isOnline, refreshConversations, user?.role],
  );

  const loadConversationMessages = useCallback(
    async (conversationId: string | number, opts?: { silent?: boolean }) => {
      const id = String(conversationId);
      if (!opts?.silent) setLoadingConversationId(id);
      try {
        const list = await chatApi.listMessages(conversationId, { page_size: 100, page: 1 });
        const conv = conversationsRef.current.find((c) => c.id === String(conversationId));
        const customerId = Number(conv?.customer.id || 0);
        const mapped = list.map((m) => ({
          id: String((m as { id?: number | string }).id ?? ""),
          conversationId: String((m as { conversation_id?: number | string; conversationId?: number | string }).conversation_id ?? (m as { conversationId?: number | string }).conversationId ?? conversationId),
          senderRole:
            (m as { sender_role?: "customer" | "provider" }).sender_role ??
            (customerId > 0 ? toRole((m as { sender_user_id?: number; senderId?: number }).sender_user_id ?? Number((m as { senderId?: number }).senderId ?? 0), customerId) : "provider"),
          senderId: String((m as { sender_user_id?: number | string; senderId?: number | string }).sender_user_id ?? (m as { senderId?: number | string }).senderId ?? ""),
          senderName: (m as { sender_full_name?: string }).sender_full_name?.trim() || "Хэрэглэгч",
          text: m.body || m.message_text || m.message || "",
          sentAtIso: toIso((m as { created_at?: string; createdAt?: string }).created_at ?? (m as { createdAt?: string }).createdAt),
          deliveryState: "sent" as const,
        }));
        const prevConversation = conversationsRef.current.find((c) => c.id === id);
        const prevIds = new Set((prevConversation?.messages || []).map((m) => m.id));
        const incomingNew = mapped.filter((m) => !prevIds.has(m.id));
        if (user?.role && prevConversation) {
          for (const m of incomingNew) {
            if (m.senderRole === user.role) continue;
            if (notifiedMessageIdsRef.current.has(m.id)) continue;
            notifiedMessageIdsRef.current.add(m.id);
            const title = m.senderRole === "provider" ? "Эмнэлгээс хариу ирлээ" : "Танд шинэ зурвас ирлээ";
            const body = String(m.text || "").trim() || "Танд шинэ зурвас ирлээ";
            void scheduleLocalDemoNotification(title, body, 1).catch(() => {});
          }
        }
        setConversations((prev) =>
          prev.map((c) =>
            c.id === id
              ? {
                  ...c,
                  messages: mergeMessages(c.messages, mapped),
                  updatedAtIso: mapped[mapped.length - 1]?.sentAtIso ?? c.updatedAtIso,
                }
              : c,
          ),
        );
        return mapped;
      } finally {
        if (!opts?.silent) setLoadingConversationId(null);
      }
    },
    [mergeMessages, user?.role],
  );

  const sendConversationMessage = useCallback(
    async (params: { conversationId: string | number; senderRole: "customer" | "provider"; senderId: string; senderName: string; text: string }) => {
      const conversationId = String(params.conversationId);
      const body = params.text.trim();
      if (!body) return;
      const active = conversationsRef.current.find((c) => c.id === conversationId);
      const hasPendingSameText = (active?.messages || []).some(
        (m) => m.deliveryState === "sending" && m.senderRole === params.senderRole && m.text.trim() === body,
      );
      if (hasPendingSameText) return;
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const tempMessage = {
        id: tempId,
        conversationId,
        senderRole: params.senderRole,
        senderId: params.senderId,
        senderName: params.senderName,
        text: body,
        sentAtIso: new Date().toISOString(),
        deliveryState: "sending" as const,
      };
      outboxRef.current[tempId] = { ...params, conversationId, text: body };
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                messages: mergeMessages([...c.messages, tempMessage], []),
                updatedAtIso: tempMessage.sentAtIso,
              }
            : c,
        ),
      );
      if (!isOnline) {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: c.messages.map((m) => (m.id === tempId ? { ...m, deliveryState: "failed" as const } : m)),
                }
              : c,
          ),
        );
        return;
      }
      try {
        await chatApi.sendMessage(conversationId, { body });
        delete outboxRef.current[tempId];
        await loadConversationMessages(conversationId, { silent: true });
        await refreshConversations();
      } catch {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: c.messages.map((m) => (m.id === tempId ? { ...m, deliveryState: "failed" as const } : m)),
                }
              : c,
          ),
        );
      }
    },
    [isOnline, loadConversationMessages, mergeMessages, refreshConversations],
  );

  const retryMessage = useCallback(
    async (conversationId: string | number, messageId: string) => {
      const queued = outboxRef.current[messageId];
      if (!queued) return;
      setConversations((prev) =>
        prev.map((c) =>
          c.id === String(conversationId)
            ? {
                ...c,
                messages: c.messages.map((m) => (m.id === messageId ? { ...m, deliveryState: "sending" as const } : m)),
              }
            : c,
        ),
      );
      try {
        await chatApi.sendMessage(conversationId, { body: queued.text });
        delete outboxRef.current[messageId];
        await loadConversationMessages(conversationId, { silent: true });
        await refreshConversations();
      } catch {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === String(conversationId)
              ? {
                  ...c,
                  messages: c.messages.map((m) => (m.id === messageId ? { ...m, deliveryState: "failed" as const } : m)),
                }
              : c,
          ),
        );
      }
    },
    [loadConversationMessages, refreshConversations],
  );

  const markConversationRead = useCallback(
    async (conversationId: string | number, role?: "customer" | "provider") => {
      await chatApi.markRead(conversationId, {});
      setConversations((prev) =>
        prev.map((c) =>
          c.id === String(conversationId)
            ? {
                ...c,
                unreadForCustomer: role === "customer" ? 0 : c.unreadForCustomer,
                unreadForProvider: role === "provider" ? 0 : c.unreadForProvider,
              }
            : c,
        ),
      );
    },
    [],
  );

  const setProviderPresence = useCallback(() => {}, []);

  return {
    conversations,
    ensureCustomerConversation,
    refreshConversations,
    loadConversationMessages,
    sendConversationMessage,
    markConversationRead,
    retryMessage,
    setProviderPresence,
    loadingConversationId,
  };
}

