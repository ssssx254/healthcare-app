import { apiRequest, apiRequestPaginated } from "@/lib/api/client";
import { withQuery } from "@/lib/api/query";
import type { ApiPaginatedData } from "@/types/api/envelope";

export type ClinicRow = {
  id: number;
  owner_user_id?: number;
  clinic_name: string;
  description?: string | null;
  address: string;
  city?: string | null;
  clinic_type?: string | null;
  phone: string;
  email?: string | null;
  approval_status?: string;
  created_at?: string;
  logo_url?: string | null;
};

export type ClinicByProviderResponse = {
  provider_user_id: number;
  onboarding_status: string;
  clinic: ClinicRow | null;
};

export type ClinicListParams = {
  page?: number;
  page_size?: number;
  sort_by?: "created_at" | "clinic_name" | string;
  sort_order?: "asc" | "desc";
  city?: string;
  clinic_type?: string;
  q?: string;
};

export const clinicApi = {
  listPaged(params?: ClinicListParams): Promise<ApiPaginatedData<ClinicRow>> {
    return apiRequestPaginated<ClinicRow>(withQuery("/clinics", params ?? {}));
  },

  /** Нийтлэг жагсаалт — олон хуудсыг нэгтгэнэ (ихэвчлэн жижиг өгөгдөл). */
  async listAll(params?: Omit<ClinicListParams, "page">): Promise<ClinicRow[]> {
    const pageSize = 100;
    const merged: ClinicRow[] = [];
    let page = 1;
    while (true) {
      const { items, meta } = await this.listPaged({ ...params, page, page_size: pageSize });
      merged.push(...items);
      if (!meta.hasNext) break;
      page += 1;
    }
    return merged;
  },

  getById(id: string | number): Promise<ClinicRow> {
    return apiRequest<ClinicRow>(`/clinics/${id}`, { method: "GET" });
  },

  /** Өөрийн эмнэлгийг `owner`-оор шууд ачаална. */
  getByProvider(providerUserId: string | number): Promise<ClinicByProviderResponse> {
    return apiRequest<ClinicByProviderResponse>(`/clinics/provider/${providerUserId}`, { method: "GET" });
  },

  create(body: {
    clinic_name: string;
    address: string;
    phone: string;
    description?: string | null;
    email?: string | null;
    city?: string | null;
    clinic_type?: string | null;
  }): Promise<ClinicRow> {
    return apiRequest<ClinicRow>("/clinics", { method: "POST", json: body });
  },

  update(
    id: string | number,
    body: Partial<{
      clinic_name: string;
      description: string | null;
      address: string;
      phone: string;
      email: string | null;
      logo_url: string | null;
    }>,
  ): Promise<ClinicRow> {
    return apiRequest<ClinicRow>(`/clinics/${id}`, { method: "PUT", json: body });
  },
};
