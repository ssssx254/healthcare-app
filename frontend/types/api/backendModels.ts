/**
 * MySQL/Express-ээс шууд ирдэг талбарууд — **snake_case**.
 * UI-д `types/healthcare/*` ашиглахдаа `services/api/mappers/fromBackend.ts` эсвэл өөрийн map-аар хувиргана.
 */

export type BackendUser = {
  id: number;
  full_name: string;
  email: string;
  role: "customer" | "provider" | "system_admin";
  onboarding_status: "pending" | "approved" | "rejected";
  phone: string | null;
  created_at: string;
};

export type BackendClinic = {
  id: number;
  owner_user_id: number;
  clinic_name: string;
  description: string | null;
  address: string;
  city: string | null;
  clinic_type: string | null;
  phone: string;
  email: string | null;
  approval_status: "pending" | "approved" | "rejected";
  created_at: string;
};

export type BackendDoctorRow = {
  id: number;
  clinic_id: number;
  full_name: string;
  specialization: string;
  title: string | null;
  bio: string | null;
  education: string | null;
  work_history: string | null;
  experience_years: number | null;
  profile_image: string | null;
  created_at: string;
  clinic_name?: string;
  clinic_approval_status?: string;
  clinic_owner_user_id?: number;
};

export type BackendServiceRow = {
  id: number;
  clinic_id: number;
  doctor_id: number | null;
  service_name: string;
  category: string;
  description: string | null;
  price: string | number;
  is_free_consultation: number | boolean;
  duration_minutes: number;
  consultation_type: "online" | "in_person";
  is_active: number | boolean;
  created_at: string;
};

export type BackendScheduleSlot = {
  id: number;
  doctor_id: number;
  service_id: number | null;
  slot_date: string;
  start_time: string;
  end_time: string;
  is_available: number | boolean;
  slot_status: "available" | "booked" | "blocked" | "unavailable";
};

export type BackendBookingRow = {
  id: number;
  patient_user_id: number;
  clinic_id: number;
  doctor_id: number;
  service_id: number;
  slot_id: number | null;
  booking_type: string;
  status: string;
  payment_required: number | boolean;
  payment_status: string;
  total_amount: string | number;
  meeting_link: string | null;
  created_at: string;
};

export type BackendConsultationRequest = {
  id: number;
  patient_user_id: number;
  clinic_id: number;
  doctor_id: number | null;
  request_type: string;
  is_free: number | boolean;
  status: string;
  meeting_link: string | null;
  patient_message: string | null;
  provider_message?: string | null;
  chat_opened_at?: string | null;
  created_at: string;
};

export type BackendMedicalNote = {
  id: number;
  patient_user_id: number;
  clinic_id: number;
  doctor_id: number;
  booking_id: number | null;
  diagnosis: string | null;
  doctor_notes: string | null;
  recommendation: string | null;
  treatment_plan: string | null;
  created_by_user_id: number;
  created_at: string;
};

export type BackendNotification = {
  id: number;
  user_id: number;
  title: string;
  body: string;
  type: string;
  reference_type: string | null;
  reference_id: number | null;
  metadata: unknown;
  is_read: number | boolean;
  created_at: string;
};

export type BackendWalletTransaction = {
  id: number;
  user_id: number;
  direction: "credit" | "debit";
  amount: string | number;
  balance_after: string | number;
  transaction_type: string;
  reference_type: string | null;
  reference_id: number | null;
  gateway_ref: string | null;
  metadata: unknown;
  created_at: string;
};
