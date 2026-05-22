import { apiRequest } from "@/lib/api/client";
import type { ApiPaginatedData } from "@/types/api/envelope";

export type DoctorReviewRow = {
  id: number;
  doctor_id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  customer_name?: string;
};

export type DoctorReviewSummary = {
  average_rating: number | null;
  review_count: number;
};

export type DoctorReviewViewer = {
  can_submit: boolean;
  booking_id: number | null;
  message: string | null;
};

export type DoctorReviewsResponse = {
  items: DoctorReviewRow[];
  meta: ApiPaginatedData<DoctorReviewRow>["meta"];
  summary: DoctorReviewSummary;
  viewer: DoctorReviewViewer;
};

export const doctorReviewApi = {
  list(
    doctorId: string | number,
    params?: { page?: number; page_size?: number; skipCache?: boolean },
  ): Promise<DoctorReviewsResponse> {
    const q = new URLSearchParams();
    if (params?.page) q.set("page", String(params.page));
    if (params?.page_size) q.set("page_size", String(params.page_size));
    const suffix = q.toString() ? `?${q.toString()}` : "";
    return apiRequest<DoctorReviewsResponse>(`/doctors/${doctorId}/reviews${suffix}`, {
      method: "GET",
      skipCache: params?.skipCache,
    });
  },

  create(
    doctorId: string | number,
    body: { booking_id: number; rating: number; comment?: string | null },
  ): Promise<{ review: DoctorReviewRow; summary: DoctorReviewSummary }> {
    return apiRequest(`/doctors/${doctorId}/reviews`, { method: "POST", json: body });
  },
};
