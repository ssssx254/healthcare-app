import type { Doctor } from "@/types/healthcare/doctor";
import type { Clinic, ClinicListItem } from "@/types/healthcare/clinic";
import type { HealthcareService } from "@/types/healthcare/service";
import type { BackendDoctorRow, BackendClinic, BackendServiceRow } from "@/types/api/backendModels";

/** API-ийн boolean/number → boolean */
function asBool(v: unknown): boolean {
  return v === true || v === 1 || v === "1";
}

/** MNT дүн — string эсвэл number */
function asMnt(v: string | number): number {
  const n = typeof v === "string" ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : 0;
}

export function mapBackendDoctor(row: BackendDoctorRow): Doctor {
  return {
    id: String(row.id),
    clinicId: String(row.clinic_id),
    name: row.full_name,
    specialty: row.specialization,
    title: row.title ?? undefined,
    experienceYears: row.experience_years ?? undefined,
    imageUrl: row.profile_image ?? undefined,
    education: row.education ?? undefined,
    workExperience: row.work_history ?? undefined,
    bio: row.bio ?? "",
  };
}

/** Нэг эмнэлгийн дэлгэрэнгүй — API-д `doctors_count` ирэхгүй бол 0 гэж тоолно. */
export function mapBackendClinic(
  row: BackendClinic & { doctors_count?: number },
  doctorsCountFallback = 0,
): Clinic {
  const doctorsCount =
    typeof row.doctors_count === "number" && Number.isFinite(row.doctors_count)
      ? row.doctors_count
      : doctorsCountFallback;
  return {
    id: String(row.id),
    name: row.clinic_name,
    address: row.address,
    city: row.city ?? "",
    phone: row.phone,
    description: row.description ?? "",
    doctorsCount,
  };
}

/** `GET /api/clinics` жагсаалтын мөр — зөвхөн товч талбарууд. */
export function mapBackendClinicListItem(row: BackendClinic & { doctors_count?: number }): ClinicListItem {
  const full = mapBackendClinic(row);
  return {
    id: full.id,
    name: full.name,
    city: full.city,
    doctorsCount: full.doctorsCount,
  };
}

export function mapBackendService(row: BackendServiceRow): HealthcareService {
  const online = row.consultation_type === "online";
  return {
    id: String(row.id),
    doctorId: row.doctor_id != null ? String(row.doctor_id) : "",
    title: row.service_name,
    durationMinutes: row.duration_minutes,
    isOnline: online,
    isAmbulatory: row.consultation_type === "in_person",
    kind: asBool(row.is_free_consultation) ? "free_online" : "formal",
    priceMnt: asMnt(row.price),
    description: row.description ?? "",
  };
}
