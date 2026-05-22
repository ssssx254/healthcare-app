import { apiRequest } from "@/lib/api/client";

export type ClinicCategoryRow = {
  id: number;
  clinic_id: number;
  name: string;
  created_at?: string;
};

export const clinicCategoryApi = {
  listPublic(): Promise<string[]> {
    return apiRequest<{ items: string[] }>("/services/categories/public", { method: "GET" }).then((r) => r.items ?? []);
  },

  listForClinic(clinicId: string | number): Promise<ClinicCategoryRow[]> {
    return apiRequest<{ items: ClinicCategoryRow[] }>(`/clinics/${clinicId}/categories`, { method: "GET" }).then(
      (r) => r.items ?? [],
    );
  },

  create(clinicId: string | number, name: string): Promise<ClinicCategoryRow> {
    return apiRequest<ClinicCategoryRow>(`/clinics/${clinicId}/categories`, {
      method: "POST",
      json: { name },
    });
  },

  remove(clinicId: string | number, categoryId: string | number): Promise<void> {
    return apiRequest(`/clinics/${clinicId}/categories/${categoryId}`, { method: "DELETE" }).then(() => undefined);
  },
};
