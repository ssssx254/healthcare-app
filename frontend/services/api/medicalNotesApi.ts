import { apiRequest } from "@/lib/api/client";
import { withQuery } from "@/lib/api/query";

export type MedicalNoteRow = {
  id: number;
  patient_user_id: number;
  clinic_id: number;
  doctor_id: number;
  booking_id?: number | null;
  diagnosis?: string | null;
  doctor_notes?: string | null;
  recommendation?: string | null;
  treatment_plan?: string | null;
  created_by_user_id: number;
  created_at: string;
};

export const medicalNotesApi = {
  listMyNotes(): Promise<MedicalNoteRow[]> {
    return apiRequest<MedicalNoteRow[]>("/medical-records/my/notes", { method: "GET" });
  },

  listNotesForPatient(query: Record<string, string | number | undefined>): Promise<MedicalNoteRow[]> {
    return apiRequest<MedicalNoteRow[]>(withQuery("/medical-records/notes", query), { method: "GET" });
  },

  createNote(body: {
    patient_user_id: number;
    clinic_id: number;
    doctor_id: number;
    booking_id?: number | null;
    diagnosis?: string | null;
    doctor_notes?: string | null;
    recommendation?: string | null;
    treatment_plan?: string | null;
  }): Promise<MedicalNoteRow> {
    return apiRequest<MedicalNoteRow>("/medical-records/notes", { method: "POST", json: body });
  },
};
