import { apiRequest, apiRequestPaginated } from "@/lib/api/client";
import { withQuery } from "@/lib/api/query";
import type { ApiPaginatedData } from "@/types/api/envelope";
import type { ProviderBookingStatus } from "@/constants/providerBookingStatus";

/** Backend `bookings` хүснэгтийн мөр (snake_case). */
export type BookingRow = {
  id: number;
  patient_user_id: number;
  clinic_id: number;
  doctor_id: number;
  service_id: number;
  slot_id?: number | null;
  booking_type: "free_online" | "formal" | string;
  status: string;
  payment_required: number | boolean;
  payment_status: string;
  total_amount: number | string;
  meeting_link?: string | null;
  created_at: string;
  questionnaire_count?: number;
  latest_questionnaire_id?: number | null;
};

export type BookingListParams = {
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  status?: string;
  payment_status?: string;
  clinic_id?: string | number;
  doctor_id?: string | number;
  from_date?: string;
  to_date?: string;
};

export type CreateBookingBody = {
  clinic_id: number;
  doctor_id: number;
  service_id: number;
  slot_id: number;
  lab_test_ids?: number[];
};

export type RescheduleBookingBody = {
  slot_id: number;
};

/** UI-ийн эмнэлгийн төлөвийг backend-ийн `bookings.status` болгон хувиргана. */
export function providerUiStatusToApiStatus(status: ProviderBookingStatus): "confirmed" | "completed" | "cancelled" {
  if (status === "confirmed") return "confirmed";
  if (status === "completed") return "completed";
  return "cancelled";
}

export const bookingApi = {
  /** Нэвтэрсэн хэрэглэгчийн эрхээр: үйлчлүүлэгч `/customer`, үзүүлэгч `/provider` (энд нэг замаар backend шүүлт хийнэ). */
  listPaged(params?: BookingListParams): Promise<ApiPaginatedData<BookingRow>> {
    return apiRequestPaginated<BookingRow>(withQuery("/bookings", params ?? {}));
  },

  async listAllBookings(params?: Omit<BookingListParams, "page">): Promise<BookingRow[]> {
    const pageSize = 100;
    const merged: BookingRow[] = [];
    let page = 1;
    while (true) {
      const { items, meta } = await this.listPaged({ ...params, page, page_size: pageSize });
      merged.push(...items);
      if (!meta.hasNext) break;
      page += 1;
    }
    return merged;
  },

  getById(id: string | number): Promise<BookingRow> {
    return apiRequest<BookingRow>(`/bookings/${id}`, { method: "GET" });
  },

  listSharedLabTests(bookingId: string | number): Promise<{ items: import("./labTestsApi").LabTestRow[] }> {
    return apiRequest<{ items: import("./labTestsApi").LabTestRow[] }>(`/bookings/${bookingId}/lab-tests`, {
      method: "GET",
    });
  },

  create(body: CreateBookingBody): Promise<BookingRow> {
    return apiRequest<BookingRow>("/bookings", { method: "POST", json: body });
  },

  markPaid(
    id: string | number,
    body?: import("./walletApi").PayBookingBody,
  ): Promise<BookingRow> {
    return apiRequest<BookingRow>(`/bookings/${id}/payment`, {
      method: "PUT",
      json: body ?? { booking_id: Number(id), channel: "wallet" },
    });
  },

  updateStatus(
    id: string | number,
    body: { status?: string; meeting_link?: string | null },
  ): Promise<BookingRow> {
    return apiRequest<BookingRow>(`/bookings/${id}/status`, { method: "PUT", json: body });
  },

  cancel(id: string | number): Promise<BookingRow> {
    return apiRequest<BookingRow>(`/bookings/${id}/cancel`, { method: "PATCH" });
  },

  /** TODO: backend endpoint finalized бол энэ дуудлага албан ёсоор ашиглана. */
  reschedule(id: string | number, body: RescheduleBookingBody): Promise<BookingRow> {
    return apiRequest<BookingRow>(`/bookings/${id}/reschedule`, { method: "PATCH", json: body });
  },
};

export type { ScheduleSlotRow } from "./scheduleApi";
