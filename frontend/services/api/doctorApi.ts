import { apiRequest, apiRequestPaginated } from "@/lib/api/client";
import { withQuery } from "@/lib/api/query";
import type { ApiPaginatedData } from "@/types/api/envelope";

export type DoctorRow = {
  id: number;
  clinic_id: number;
  full_name: string;
  specialization: string;
  title?: string | null;
  bio?: string | null;
  experience_years?: number | null;
  profile_image?: string | null;
  education?: string | null;
  work_history?: string | null;
  created_at?: string;
  clinic_name?: string;
};

export type DoctorListParams = {
  clinic_id?: string | number;
  specialty?: string;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
};

export const doctorApi = {
  listPaged(params?: DoctorListParams): Promise<ApiPaginatedData<DoctorRow>> {
    return apiRequestPaginated<DoctorRow>(withQuery("/doctors", params ?? {}));
  },

  async listAll(params?: Omit<DoctorListParams, "page">): Promise<DoctorRow[]> {
    const pageSize = 100;
    const merged: DoctorRow[] = [];
    let page = 1;
    while (true) {
      const { items, meta } = await this.listPaged({ ...params, page, page_size: pageSize });
      merged.push(...items);
      if (!meta.hasNext) break;
      page += 1;
    }
    return merged;
  },

  getById(id: string | number): Promise<DoctorRow> {
    return apiRequest<DoctorRow>(`/doctors/${id}`, { method: "GET" });
  },

  create(body: {
    clinic_id: number;
    full_name: string;
    specialization: string;
    title?: string | null;
    bio?: string | null;
    experience_years?: number | null;
    education?: string | null;
    work_history?: string | null;
    profile_image?: string | null;
  }): Promise<DoctorRow> {
    return apiRequest<DoctorRow>("/doctors", { method: "POST", json: body });
  },

  update(
    id: string | number,
    body: Partial<{
      full_name: string;
      specialization: string;
      bio: string | null;
      experience_years: number | null;
      title: string | null;
      education: string | null;
      work_history: string | null;
      profile_image: string | null;
    }>,
  ): Promise<DoctorRow> {
    return apiRequest<DoctorRow>(`/doctors/${id}`, { method: "PUT", json: body });
  },
};
