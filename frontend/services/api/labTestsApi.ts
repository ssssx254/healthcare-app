import { apiRequest } from "@/lib/api/client";
import type { LabTestStatus } from "@/constants/labTestStatus";

export type LabFileType = "pdf" | "image" | "none" | null;

export type LabTestRow = {
  id: number;
  patient_user_id: number;
  clinic_id: number | null;
  doctor_id: number | null;
  booking_id: number | null;
  title: string;
  test_type: string;
  test_date: string;
  description: string | null;
  attachment_url: string | null;
  attachment_type: LabFileType;
  result_text: string | null;
  result_file_url: string | null;
  result_file_type: LabFileType;
  doctor_notes: string | null;
  status: LabTestStatus;
  uploaded_by: "customer" | "clinic";
  created_by_user_id: number;
  reviewed_by_user_id: number | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  clinic_name?: string | null;
  doctor_name?: string | null;
};

export type LabTestsListResponse = { items: LabTestRow[] };

export type CreateCustomerLabTestBody = {
  title: string;
  test_type: string;
  test_date: string;
  description?: string | null;
  attachment_url?: string | null;
  attachment_type?: LabFileType;
  clinic_id?: number | null;
  booking_id?: number | null;
};

export type UpdateProviderLabTestBody = {
  result_text?: string | null;
  doctor_notes?: string | null;
  result_file_url?: string | null;
  result_file_type?: LabFileType;
  status?: LabTestStatus;
};

export type CreateProviderLabTestBody = {
  patient_user_id: number;
  clinic_id: number;
  doctor_id?: number | null;
  title: string;
  test_type: string;
  test_date: string;
  description?: string | null;
  attachment_url?: string | null;
  attachment_type?: LabFileType;
  result_text?: string | null;
  result_file_url?: string | null;
  result_file_type?: LabFileType;
  doctor_notes?: string | null;
};

export const labTestsApi = {
  listMine(filter?: "all" | "mine" | "clinic"): Promise<LabTestsListResponse> {
    const q = filter && filter !== "all" ? `?filter=${filter}` : "";
    return apiRequest<LabTestsListResponse>(`/lab-tests/my${q}`, { method: "GET" });
  },

  getMine(id: string | number): Promise<LabTestRow> {
    return apiRequest<LabTestRow>(`/lab-tests/my/${id}`, { method: "GET" });
  },

  createMine(body: CreateCustomerLabTestBody): Promise<LabTestRow> {
    return apiRequest<LabTestRow>("/lab-tests/my", { method: "POST", json: body });
  },

  listForProvider(params?: {
    patient_user_id?: number;
    clinic_id?: number;
    doctor_id?: number;
    booking_id?: number;
  }): Promise<LabTestsListResponse> {
    const q = new URLSearchParams();
    if (params?.patient_user_id) q.set("patient_user_id", String(params.patient_user_id));
    if (params?.clinic_id) q.set("clinic_id", String(params.clinic_id));
    if (params?.doctor_id) q.set("doctor_id", String(params.doctor_id));
    if (params?.booking_id) q.set("booking_id", String(params.booking_id));
    const suffix = q.toString() ? `?${q.toString()}` : "";
    return apiRequest<LabTestsListResponse>(`/lab-tests${suffix}`, { method: "GET" });
  },

  getForProvider(id: string | number): Promise<LabTestRow> {
    return apiRequest<LabTestRow>(`/lab-tests/${id}`, { method: "GET" });
  },

  updateForProvider(id: string | number, body: UpdateProviderLabTestBody): Promise<LabTestRow> {
    return apiRequest<LabTestRow>(`/lab-tests/${id}`, { method: "PATCH", json: body });
  },

  createForProvider(body: CreateProviderLabTestBody): Promise<LabTestRow> {
    return apiRequest<LabTestRow>("/lab-tests", { method: "POST", json: body });
  },
};
