import { clinicApi } from "@/services/api/clinicApi";
import { doctorApi } from "@/services/api/doctorApi";
import { scheduleApi } from "@/services/api/scheduleApi";
import { serviceApi } from "@/services/api/serviceApi";
import { mergeDoctorPhotosIntoDoctors, mergeDoctorPhotoIntoDoctor } from "@/data/healthcare/doctorPhotoOverridesStore";
import {
  mapClinicRow,
  mapDoctorRow,
  mapServiceRow,
  mapSlotRow,
} from "@/services/catalogMappers";
import type { MockClinicDetail, MockDoctor, MockService, MockTimeSlot } from "@/types/customer";

async function doctorsCountByClinic(): Promise<Map<string, number>> {
  const doctors = await doctorApi.listAll();
  const map = new Map<string, number>();
  for (const d of doctors) {
    const k = String(d.clinic_id);
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return map;
}

export async function getClinicList(): Promise<MockClinicDetail[]> {
  const [rows, counts] = await Promise.all([clinicApi.listAll(), doctorsCountByClinic()]);
  return rows.map((c) => mapClinicRow(c, counts.get(String(c.id)) ?? 0));
}

export async function getClinicById(id: string): Promise<MockClinicDetail | undefined> {
  try {
    const row = await clinicApi.getById(id);
    const doctors = await doctorApi.listAll({ clinic_id: id });
    return mapClinicRow(row, doctors.length);
  } catch {
    return undefined;
  }
}

export async function getDoctorsByClinic(clinicId: string): Promise<MockDoctor[]> {
  const rows = await doctorApi.listAll({ clinic_id: clinicId });
  return mergeDoctorPhotosIntoDoctors(rows.map(mapDoctorRow));
}

export async function getDoctor(clinicId: string, doctorId: string): Promise<MockDoctor | undefined> {
  try {
    const row = await doctorApi.getById(doctorId);
    if (String(row.clinic_id) !== clinicId) return undefined;
    return mergeDoctorPhotoIntoDoctor(mapDoctorRow(row));
  } catch {
    return undefined;
  }
}

export async function getServicesByDoctor(doctorId: string): Promise<MockService[]> {
  const rows = await serviceApi.listAll({ doctor_id: doctorId });
  return rows.map(mapServiceRow).filter((s) => s.isActive !== false);
}

export async function getService(doctorId: string, serviceId: string): Promise<MockService | undefined> {
  try {
    const row = await serviceApi.getById(serviceId);
    if (row.doctor_id != null && String(row.doctor_id) !== doctorId) {
      return undefined;
    }
    const mapped = mapServiceRow(row);
    if (mapped.isActive === false) return undefined;
    return mapped;
  } catch {
    return undefined;
  }
}

export async function getProviderServiceCategories(): Promise<string[]> {
  const rows = await serviceApi.listAll();
  const names = Array.from(
    new Set(
      rows
        .filter((r) => r.is_active === undefined || r.is_active === 1 || r.is_active === true)
        .map((r) => String(r.category || "").trim())
        .filter(Boolean),
    ),
  );
  return names.sort((a, b) => a.localeCompare(b, "mn"));
}

export async function getSlotsByDoctor(
  doctorId: string,
  opts?: { serviceId?: string; fromDate?: string; toDate?: string },
): Promise<MockTimeSlot[]> {
  const rows = await scheduleApi.listAvailableSlotsForCustomer({
    doctor_id: doctorId,
    service_id: opts?.serviceId,
    from_date: opts?.fromDate,
    to_date: opts?.toDate,
    page_size: 400,
  });
  // Зарим provider слот service_id-гүй (NULL) байдлаар хадгалагдсан байдаг.
  // Тухайн service_id-тай хүсэлт хоосон бол ерөнхий (doctor-level) боломжит слотуудыг дахин авна.
  const fallbackRows =
    rows.length === 0 && opts?.serviceId
      ? await scheduleApi.listAvailableSlotsForCustomer({
          doctor_id: doctorId,
          from_date: opts?.fromDate,
          to_date: opts?.toDate,
          page_size: 400,
        })
      : rows;
  // `/schedule-slots/available` нь backend дээрээ зөвхөн боломжит слотуудыг буцаадаг
  // (is_available=1, slot_status='available'), тиймээс энд дахин шүүх шаардлагагүй.
  return fallbackRows.map(mapSlotRow);
}

/** Нүүр болон онцлох хэсэгт — баталгаажсан эмнэлгийн эмч нар (API). */
export async function getSpotlightDoctors(limit: number): Promise<MockDoctor[]> {
  const rows = await doctorApi.listAll();
  const mapped = await mergeDoctorPhotosIntoDoctors(rows.map(mapDoctorRow));
  const n = Math.max(0, Math.floor(limit));
  return mapped.slice(0, n);
}

export async function searchCatalogAsync(
  query: string,
  city?: string,
  specialty?: string,
): Promise<{ clinics: MockClinicDetail[]; doctors: MockDoctor[] }> {
  const q = query.trim().toLowerCase();
  const [clinics, doctorRows] = await Promise.all([getClinicList(), doctorApi.listAll()]);
  const doctors = await mergeDoctorPhotosIntoDoctors(doctorRows.map(mapDoctorRow));
  const activeServices = await serviceApi.listAll();
  const activeDoctorIds = new Set(
    activeServices
      .filter((s) => s.is_active === undefined || s.is_active === 1 || s.is_active === true)
      .map((s) => (s.doctor_id != null ? String(s.doctor_id) : null))
      .filter((v): v is string => Boolean(v)),
  );

  const filteredClinics = clinics.filter((c) => {
    if (city && c.city !== city) return false;
    if (!q) return true;
    return c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q) || c.address.toLowerCase().includes(q);
  });

  const filteredDoctors = doctors.filter((d) => {
    if (activeDoctorIds.size > 0 && !activeDoctorIds.has(d.id)) return false;
    const clinic = clinics.find((c) => c.id === d.clinicId);
    if (city && clinic?.city !== city) return false;
    if (specialty && !d.specialty.includes(specialty)) return false;
    if (!q) return true;
    return d.name.toLowerCase().includes(q) || d.specialty.toLowerCase().includes(q);
  });

  return { clinics: filteredClinics, doctors: filteredDoctors };
}
