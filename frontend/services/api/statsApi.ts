import { apiRequest } from "@/lib/api/client";

export type AdminStatsResponse = {
  total_users: number;
  total_providers: number;
  pending_clinics: number;
  total_bookings: number;
  paid_revenue_total: number;
  clinic_paid_revenue?: Array<{
    clinic_id: number;
    clinic_name: string;
    approval_status?: string | null;
    paid_bookings_count: number;
    paid_revenue_total: number;
  }>;
};

export const statsApi = {
  admin(): Promise<AdminStatsResponse> {
    return apiRequest<AdminStatsResponse>("/stats/admin", { method: "GET" });
  },
};

