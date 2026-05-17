import type { Doctor } from "@/types/healthcare/doctor";

export function fallbackDoctorAvatarUri(name: string, size: number): string {
  const encoded = encodeURIComponent(name.trim() || "Эмч");
  return `https://ui-avatars.com/api/?name=${encoded}&background=2563eb&color=ffffff&size=${size}`;
}

export function resolveDoctorAvatarUri(doctor: Pick<Doctor, "name" | "imageUrl">, size: number): string {
  const u = doctor.imageUrl?.trim();
  if (u) return u;
  return fallbackDoctorAvatarUri(doctor.name, size);
}
