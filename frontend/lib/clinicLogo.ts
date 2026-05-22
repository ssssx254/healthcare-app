import type { Clinic } from "@/types/healthcare";

/** Эмнэлгийн лого — API `logoUrl` эсвэл нэрээр үүсгэсэн placeholder. */
export function resolveClinicLogoUri(clinic: Pick<Clinic, "name"> & { logoUrl?: string | null }, size = 80): string {
  const logo = clinic.logoUrl?.trim();
  if (logo && (logo.startsWith("http") || logo.startsWith("data:image/"))) {
    return logo;
  }
  const name = clinic.name?.trim() || "Эмнэлэг";
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0d9488&color=ffffff&size=${size}`;
}
