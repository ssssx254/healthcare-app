import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Doctor } from "@/types/healthcare/doctor";

const STORAGE_KEY = "doctor_photo_uri_overrides_v1";

export async function loadDoctorPhotoOverrides(): Promise<Record<string, string>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, string>;
  } catch {
    return {};
  }
}

export async function setDoctorPhotoOverride(doctorId: string, uri: string): Promise<void> {
  const all = await loadDoctorPhotoOverrides();
  all[doctorId] = uri;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export async function removeDoctorPhotoOverride(doctorId: string): Promise<void> {
  const all = await loadDoctorPhotoOverrides();
  delete all[doctorId];
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

/** Төхөөрөмж дээрх түр зургийн зам нь API-аас ирсэн `imageUrl`-ийг дарна. */
export async function mergeDoctorPhotosIntoDoctors<T extends Pick<Doctor, "id" | "imageUrl">>(doctors: T[]): Promise<T[]> {
  const overrides = await loadDoctorPhotoOverrides();
  return doctors.map((d) => {
    const o = overrides[d.id];
    if (!o?.trim()) return d;
    return { ...d, imageUrl: o.trim() };
  });
}

export async function mergeDoctorPhotoIntoDoctor<T extends Pick<Doctor, "id" | "imageUrl">>(doctor: T): Promise<T> {
  const merged = await mergeDoctorPhotosIntoDoctors([doctor]);
  return merged[0] ?? doctor;
}
