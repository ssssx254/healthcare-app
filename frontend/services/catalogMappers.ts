import type { ScheduleSlotRow } from "@/services/api/scheduleApi";
import type { ClinicRow } from "@/services/api/clinicApi";
import type { DoctorRow } from "@/services/api/doctorApi";
import type { ServiceRow } from "@/services/api/serviceApi";
import type { MockClinicDetail, MockDoctor, MockService, MockTimeSlot } from "@/types/customer";
import type { ServiceKind } from "@/types/healthcare";

export function mapClinicRow(row: ClinicRow, doctorsCount: number): MockClinicDetail {
  if (row.city && String(row.city).trim()) {
    return {
      id: String(row.id),
      name: row.clinic_name,
      city: String(row.city).trim(),
      address: row.address,
      phone: row.phone,
      description: row.description?.trim() || "—",
      doctorsCount,
    };
  }
  const firstLine = row.address.split("\n")[0]?.trim() || row.address;
  const city = firstLine.length > 32 ? `${firstLine.slice(0, 32)}…` : firstLine || "—";
  return {
    id: String(row.id),
    name: row.clinic_name,
    city,
    address: row.address,
    phone: row.phone,
    description: row.description?.trim() || "—",
    doctorsCount,
  };
}

export function mapDoctorRow(row: DoctorRow): MockDoctor {
  const profile = row.profile_image?.trim();
  const title = row.title?.trim();
  const education = row.education?.trim();
  const workExperience = row.work_history?.trim();
  return {
    id: String(row.id),
    clinicId: String(row.clinic_id),
    name: row.full_name,
    specialty: row.specialization,
    experienceYears: row.experience_years ?? undefined,
    bio: row.bio?.trim() || "",
    ...(title ? { title } : {}),
    ...(profile ? { imageUrl: profile } : {}),
    ...(education ? { education } : {}),
    ...(workExperience ? { workExperience } : {}),
    averageRating: row.average_rating != null ? Number(row.average_rating) : null,
    reviewCount: Number(row.review_count ?? 0),
  };
}

function serviceKind(row: ServiceRow): ServiceKind {
  return row.is_free_consultation === 1 || row.is_free_consultation === true ? "free_online" : "formal";
}

export function mapServiceRow(row: ServiceRow): MockService {
  const doctorId = row.doctor_id != null ? String(row.doctor_id) : "";
  const kind = serviceKind(row);
  const ct = String(row.consultation_type ?? "").toLowerCase();
  const isOnline = kind === "free_online" || ct === "online";
  const isAmbulatory = kind === "formal" && ct === "in_person";
  return {
    id: String(row.id),
    doctorId,
    categoryId: row.category ? `cat-${row.category.replace(/\s+/g, "-").slice(0, 24)}` : undefined,
    categoryName: row.category?.trim() || undefined,
    title: row.service_name,
    durationMinutes: row.duration_minutes,
    kind,
    isOnline,
    isAmbulatory,
    isActive: row.is_active === undefined ? true : row.is_active === 1 || row.is_active === true,
    priceMnt: Math.round(Number(row.price ?? 0)),
    description: row.description?.trim() || "",
  };
}

export function mapSlotRow(row: ScheduleSlotRow): MockTimeSlot {
  const start = String(row.start_time).slice(0, 5);
  const end = String(row.end_time).slice(0, 5);
  const label = `${row.slot_date} ${start} – ${end}`;
  const toMinutes = (hm: string) => {
    const [h, m] = hm.split(":").map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
    return h * 60 + m;
  };
  return {
    id: String(row.id),
    doctorId: String(row.doctor_id),
    serviceId: row.service_id != null ? String(row.service_id) : null,
    dateIso: row.slot_date,
    startTime: start,
    endTime: end,
    durationMinutes: Math.max(0, toMinutes(end) - toMinutes(start)),
    status: row.slot_status,
    isAvailable: row.is_available === 1 || row.is_available === true,
    label,
  };
}
