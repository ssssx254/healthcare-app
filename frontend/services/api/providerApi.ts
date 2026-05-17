import { apiRequest } from "@/lib/api/client";

export type ProviderStatsResponse = {
  total_bookings: number;
  pending?: number;
  confirmed: number;
  completed: number;
  cancelled?: number;
  revenue_total?: number;
  total_revenue_mnt?: number;
  top_service_name?: string | null;
  active_doctors?: number;
};

export const providerApi = {
  /** Шинэ endpoint нь `/stats/provider`; хуучин `/provider/stats`-д backward fallback хийж дэмжинэ. */
  async getStats(): Promise<ProviderStatsResponse> {
    try {
      return await apiRequest<ProviderStatsResponse>("/stats/provider", { method: "GET" });
    } catch (error) {
      if (error instanceof Error && "status" in error && (error as { status?: number }).status === 404) {
        return apiRequest<ProviderStatsResponse>("/provider/stats", { method: "GET" });
      }
      throw error;
    }
  },
};

