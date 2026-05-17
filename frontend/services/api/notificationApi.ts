import { apiRequest, apiRequestPaginated } from "@/lib/api/client";
import { withQuery } from "@/lib/api/query";
import type { ApiPaginatedData } from "@/types/api/envelope";

export type NotificationRow = {
  id: number;
  user_id: number;
  title: string;
  body: string;
  type?: string | null;
  reference_type?: string | null;
  reference_id?: number | null;
  metadata?: unknown;
  is_read: number | boolean;
  created_at: string;
};

export type NotificationListParams = {
  page?: number;
  page_size?: number;
  is_read?: boolean | 0 | 1 | "true" | "false";
  type?: string;
};

export const notificationApi = {
  listMinePaged(params?: NotificationListParams): Promise<ApiPaginatedData<NotificationRow>> {
    return apiRequestPaginated<NotificationRow>(withQuery("/notifications/me", params ?? {}));
  },

  async listMineAll(params?: Omit<NotificationListParams, "page">): Promise<NotificationRow[]> {
    const pageSize = 50;
    const merged: NotificationRow[] = [];
    let page = 1;
    while (true) {
      const { items, meta } = await this.listMinePaged({ ...params, page, page_size: pageSize });
      merged.push(...items);
      if (!meta.hasNext) break;
      page += 1;
    }
    return merged;
  },

  unreadCount(): Promise<{ unread_count: number }> {
    return apiRequest<{ unread_count: number }>("/notifications/me/unread-count", { method: "GET" });
  },

  markRead(id: string | number): Promise<{ id: number; is_read: boolean }> {
    return apiRequest(`/notifications/${id}/read`, { method: "PATCH" });
  },

  markAllRead(): Promise<{ marked_all: boolean }> {
    return apiRequest("/notifications/me/read-all", { method: "PATCH" });
  },

  registerPushToken(expo_push_token: string): Promise<{ saved: boolean }> {
    return apiRequest("/notifications/push-token", {
      method: "POST",
      json: { expo_push_token, platform: "expo" },
    });
  },
};
