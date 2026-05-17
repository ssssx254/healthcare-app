import { apiRequest, apiRequestPaginated } from "@/lib/api/client";
import { withQuery } from "@/lib/api/query";
import type { ApiPaginatedData } from "@/types/api/envelope";

export type ConsultationRow = {
  id: number;
  patient_user_id: number;
  clinic_id: number;
  doctor_id?: number | null;
  request_type: string;
  is_free: number | boolean;
  status: "pending" | "accepted" | "closed" | "cancelled" | string;
  meeting_link?: string | null;
  patient_message?: string | null;
  provider_message?: string | null;
  chat_opened_at?: string | null;
  created_at?: string;
};

export type ConsultationListParams = {
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  status?: string;
  clinic_id?: string | number;
  doctor_id?: string | number;
  from_date?: string;
  to_date?: string;
};

export const consultationApi = {
  listPaged(params?: ConsultationListParams): Promise<ApiPaginatedData<ConsultationRow>> {
    return apiRequestPaginated<ConsultationRow>(withQuery("/consultations", params ?? {}));
  },

  listCustomerPaged(params?: ConsultationListParams): Promise<ApiPaginatedData<ConsultationRow>> {
    return apiRequestPaginated<ConsultationRow>(withQuery("/consultations/customer", params ?? {}));
  },

  listProviderPaged(params?: ConsultationListParams): Promise<ApiPaginatedData<ConsultationRow>> {
    return apiRequestPaginated<ConsultationRow>(withQuery("/consultations/provider", params ?? {}));
  },

  async listAllForCustomer(params?: Omit<ConsultationListParams, "page">): Promise<ConsultationRow[]> {
    const pageSize = 100;
    const merged: ConsultationRow[] = [];
    let page = 1;
    while (true) {
      const { items, meta } = await this.listCustomerPaged({ ...params, page, page_size: pageSize });
      merged.push(...items);
      if (!meta.hasNext) break;
      page += 1;
    }
    return merged;
  },

  async listAllForProvider(params?: Omit<ConsultationListParams, "page">): Promise<ConsultationRow[]> {
    const pageSize = 100;
    const merged: ConsultationRow[] = [];
    let page = 1;
    while (true) {
      const { items, meta } = await this.listProviderPaged({ ...params, page, page_size: pageSize });
      merged.push(...items);
      if (!meta.hasNext) break;
      page += 1;
    }
    return merged;
  },

  getById(id: string | number): Promise<ConsultationRow> {
    return apiRequest<ConsultationRow>(`/consultations/${id}`, { method: "GET" });
  },

  create(body: {
    clinic_id: number;
    doctor_id?: number | null;
    patient_message?: string | null;
    request_type?: string;
    is_free?: boolean;
  }): Promise<ConsultationRow> {
    return apiRequest<ConsultationRow>("/consultations", { method: "POST", json: body });
  },

  update(
    id: string | number,
    body: {
      status?: string;
      meeting_link?: string | null;
      provider_message?: string | null;
      open_chat?: boolean;
    },
  ): Promise<ConsultationRow> {
    return apiRequest<ConsultationRow>(`/consultations/${id}`, { method: "PUT", json: body });
  },

  cancel(id: string | number): Promise<ConsultationRow> {
    return apiRequest<ConsultationRow>(`/consultations/${id}/cancel`, { method: "PATCH" });
  },
};
