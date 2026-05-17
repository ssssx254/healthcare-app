import { apiRequest } from "@/lib/api/client";

export type QuestionnaireRow = {
  id: number;
  patient_user_id: number;
  booking_id?: number | null;
  consultation_request_id?: number | null;
  answers_json: Record<string, unknown> | string;
  created_at?: string;
};

export const questionnaireApi = {
  /**
   * Зөвхөн нэг холбоос: `booking_id` **эсвэл** `consultation_request_id`.
   * Төлөв: албан захиалга `bookings.status === "pending"` үед; зөвлөгөө `pending` | `accepted`.
   */
  create(body: {
    booking_id?: number;
    consultation_request_id?: number;
    answers: Record<string, string | number | boolean>;
  }): Promise<QuestionnaireRow> {
    return apiRequest<QuestionnaireRow>("/questionnaires", { method: "POST", json: body });
  },

  getById(id: string | number): Promise<QuestionnaireRow> {
    return apiRequest<QuestionnaireRow>(`/questionnaires/${id}`, { method: "GET" });
  },
};
