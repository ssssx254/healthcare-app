import { apiRequest, apiRequestPaginated } from "@/lib/api/client";
import { withQuery } from "@/lib/api/query";
import type { ApiPaginatedData } from "@/types/api/envelope";

export type ServiceRow = {
  id: number;
  clinic_id: number;
  doctor_id?: number | null;
  service_name: string;
  category: string;
  description?: string | null;
  price: number | string;
  is_free_consultation: number | boolean;
  duration_minutes: number;
  consultation_type?: "online" | "in_person" | string;
  is_active?: number | boolean;
  created_at?: string;
};

export type ServiceListParams = {
  clinic_id?: string | number;
  doctor_id?: string | number;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
};

export const serviceApi = {
  listPaged(params?: ServiceListParams): Promise<ApiPaginatedData<ServiceRow>> {
    return apiRequestPaginated<ServiceRow>(withQuery("/services", params ?? {}));
  },

  async listAll(params?: Omit<ServiceListParams, "page">): Promise<ServiceRow[]> {
    const pageSize = 100;
    const merged: ServiceRow[] = [];
    let page = 1;
    while (true) {
      const { items, meta } = await this.listPaged({ ...params, page, page_size: pageSize });
      merged.push(...items);
      if (!meta.hasNext) break;
      page += 1;
    }
    return merged;
  },

  getById(id: string | number): Promise<ServiceRow> {
    return apiRequest<ServiceRow>(`/services/${id}`, { method: "GET" });
  },

  create(body: Record<string, unknown>): Promise<ServiceRow> {
    return apiRequest<ServiceRow>("/services", { method: "POST", json: body });
  },

  update(id: string | number, body: Record<string, unknown>): Promise<ServiceRow> {
    return apiRequest<ServiceRow>(`/services/${id}`, { method: "PUT", json: body });
  },

  remove(id: string | number): Promise<ServiceRow> {
    return apiRequest<ServiceRow>(`/services/${id}`, { method: "DELETE" });
  },
};
