import { apiRequest } from "@/lib/api/client";

/** `POST /chat/conversations/ensure` — үйлчлүүлэгч: `clinic_id`; үзүүлэгч: `clinic_id`, `customer_user_id`. */
export type EnsureChatConversationBody =
  | { clinic_id: number }
  | { clinic_id: number; customer_user_id: number };

/** `POST /chat/conversations/:id/messages` — сервер `body.body`-г уншина (текстийн агуулга). */
export type SendChatMessageBody = { body: string };

/** `PATCH /chat/conversations/:id/read` — `up_to_message_id` заавал биш. */
export type MarkChatReadBody = { up_to_message_id?: number };

export type ChatConversationRow = {
  id: number;
  clinic_id: number;
  clinic_name?: string;
  customer_user_id: number;
  customer_full_name?: string;
  provider_user_id: number;
  provider_full_name?: string;
  last_message_at?: string | null;
  last_message?: string | null;
  last_message_preview?: string | null;
  last_message_sender_id?: number | null;
  unread_count?: number;
  created_at: string;
  updated_at: string;
};

export type ChatMessageRow = {
  id: number;
  conversation_id: number;
  sender_user_id: number;
  sender_role?: "customer" | "provider" | string;
  sender_full_name?: string;
  body?: string;
  message?: string;
  message_text?: string;
  created_at: string;
  is_read?: boolean;
};

type PaginatedData<T> = {
  items: T[];
  meta?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages?: number;
  };
};

export const chatApi = {
  ensureConversation(body: EnsureChatConversationBody): Promise<ChatConversationRow> {
    return apiRequest<ChatConversationRow>("/chat/conversations", { method: "POST", json: body });
  },

  listConversations(): Promise<ChatConversationRow[]> {
    return apiRequest<PaginatedData<ChatConversationRow> | ChatConversationRow[]>("/chat/conversations", { method: "GET" }).then((res) =>
      Array.isArray(res) ? res : res.items,
    );
  },

  listMessages(
    conversationId: string | number,
    query?: { page_size?: string | number; page?: string | number },
  ): Promise<ChatMessageRow[]> {
    const sp = new URLSearchParams();
    if (query?.page_size != null) sp.set("page_size", String(query.page_size));
    if (query?.page != null) sp.set("page", String(query.page));
    const qs = sp.toString();
    const path = qs ? `/chat/conversations/${conversationId}/messages?${qs}` : `/chat/conversations/${conversationId}/messages`;
    return apiRequest<PaginatedData<ChatMessageRow> | ChatMessageRow[]>(path, { method: "GET" }).then((res) =>
      Array.isArray(res) ? res : res.items,
    );
  },

  sendMessage(conversationId: string | number, body: SendChatMessageBody): Promise<ChatMessageRow> {
    return apiRequest<ChatMessageRow>(`/chat/conversations/${conversationId}/messages`, {
      method: "POST",
      json: { message: body.body, body: body.body },
    });
  },

  markRead(conversationId: string | number, body?: MarkChatReadBody): Promise<{ conversationId?: number; lastReadMessageId?: number }> {
    return apiRequest<{ conversationId?: number; lastReadMessageId?: number }>(`/chat/conversations/${conversationId}/read`, {
      method: "POST",
      json: body ?? {},
    });
  },
};
