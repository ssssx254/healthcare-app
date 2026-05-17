import { apiRequest, apiRequestPaginated } from "@/lib/api/client";
import { withQuery } from "@/lib/api/query";
import type { ApiPaginatedData } from "@/types/api/envelope";

export type PendingProviderRegistrationRow = {
  provider_user_id: number;
  provider_full_name: string;
  provider_email: string;
  provider_phone: string | null;
  user_onboarding_status: string;
  user_created_at?: string;
  submission_id: number | null;
  clinic_name: string | null;
  clinic_type: string | null;
  city: string | null;
  district: string | null;
  manager_name: string | null;
  introduction: string | null;
  submission_status: string | null;
  submission_created_at: string | null;
};

export type AdminDashboardResponse = {
  platform: {
    total_customers: number;
    total_providers: number;
    total_system_admins: number;
    pending_clinics: number;
    total_bookings: number;
    total_consultations: number;
    pending_provider_registrations: number;
    open_content_reports: number;
    active_featured_items: number;
  };
  payments: unknown;
};

export type ProviderReviewBody = {
  decision: "approved" | "rejected";
  feedback?: string | null;
};

export type ProviderReviewResponse = {
  user: {
    id: number;
    full_name: string;
    email: string;
    role: string;
    onboarding_status?: string;
    phone?: string | null;
    created_at?: string;
  };
  submission: unknown;
};

export type AdminUserRow = {
  id: number;
  full_name: string;
  email: string;
  phone?: string | null;
  role: "customer" | "provider" | "system_admin" | string;
  onboarding_status?: "pending" | "approved" | "rejected" | string;
  created_at?: string;
  clinic_id?: number | null;
  clinic_name?: string | null;
  approval_status?: "pending" | "approved" | "rejected" | string | null;
};

export type AdminFeaturedRow = {
  id: number;
  item_type: "clinic" | "article" | string;
  clinic_id?: number | null;
  article_title?: string | null;
  article_excerpt?: string | null;
  article_url?: string | null;
  sort_order: number;
  is_active: number | boolean;
  created_at?: string;
};

export type AdminContentReportRow = {
  id: number;
  reporter_user_id: number;
  reporter_full_name?: string;
  reporter_email?: string;
  target_type: "clinic" | "doctor" | "article" | string;
  target_id?: number | null;
  reason_code: string;
  details?: string | null;
  status: "open" | "reviewing" | "resolved" | "dismissed" | string;
  admin_notes?: string | null;
  reviewed_by?: number | null;
  reviewed_at?: string | null;
  created_at: string;
};

export const adminApi = {
  getDashboard(): Promise<AdminDashboardResponse> {
    return apiRequest<AdminDashboardResponse>("/admin/dashboard", { method: "GET" });
  },

  listPendingProviderRegistrations(): Promise<PendingProviderRegistrationRow[]> {
    return apiRequest<PendingProviderRegistrationRow[]>("/admin/providers/registrations/pending", {
      method: "GET",
    });
  },

  reviewProviderRegistration(providerUserId: number, body: ProviderReviewBody): Promise<ProviderReviewResponse> {
    return apiRequest<ProviderReviewResponse>(`/admin/providers/registrations/${providerUserId}/review`, {
      method: "PATCH",
      json: body,
    });
  },

  listUsers(params?: {
    role?: "customer" | "provider" | "system_admin";
    q?: string;
    page?: number;
    page_size?: number;
  }): Promise<ApiPaginatedData<AdminUserRow>> {
    return apiRequestPaginated<AdminUserRow>(withQuery("/admin/users", params ?? {}));
  },

  patchProviderSuspension(providerUserId: number, suspended: boolean): Promise<{ suspended: boolean; onboarding_status: string }> {
    return apiRequest(`/admin/providers/${providerUserId}/suspension`, {
      method: "PATCH",
      json: { suspended },
    });
  },

  listFeaturedItems(): Promise<AdminFeaturedRow[]> {
    return apiRequest("/admin/featured/items", { method: "GET" });
  },

  createFeaturedClinic(clinicId: number, sortOrder = 0): Promise<AdminFeaturedRow> {
    return apiRequest("/admin/featured/items", {
      method: "POST",
      json: { item_type: "clinic", clinic_id: clinicId, sort_order: sortOrder, is_active: true },
    });
  },

  patchFeatured(id: number, patch: Partial<Pick<AdminFeaturedRow, "sort_order" | "is_active" | "article_title" | "article_excerpt" | "article_url">>) {
    return apiRequest(`/admin/featured/items/${id}`, { method: "PATCH", json: patch });
  },

  deleteFeatured(id: number): Promise<{ deleted: boolean; id: number }> {
    return apiRequest(`/admin/featured/items/${id}`, { method: "DELETE" });
  },

  listContentReports(params?: { status?: "open" | "reviewing" | "resolved" | "dismissed"; page?: number; page_size?: number }) {
    return apiRequestPaginated<AdminContentReportRow>(withQuery("/admin/content-reports", params ?? {}));
  },

  patchContentReport(id: number, body: { status: "open" | "reviewing" | "resolved" | "dismissed"; admin_notes?: string | null }) {
    return apiRequest<AdminContentReportRow>(`/admin/content-reports/${id}`, { method: "PATCH", json: body });
  },

  broadcastNotification(body: {
    audience: "all" | "customer" | "provider" | "system_admin";
    title: string;
    message: string;
    type?: string;
  }): Promise<{ audience: string; sent_count: number; push_ready_count: number }> {
    return apiRequest("/admin/notifications/broadcast", { method: "POST", json: body });
  },
};
