import type { ProviderCategory, ProviderService } from "@/types/provider";

function categoryNameForApi(categories: ProviderCategory[], categoryId?: string): string {
  if (!categoryId) return "Ерөнхий";
  return categories.find((c) => c.id === categoryId)?.name?.trim() || "Ерөнхий";
}

/** Backend `POST /services` биеийн бүтэц. */
export function providerServiceToCreateBody(
  clinicId: string,
  categories: ProviderCategory[],
  s: Omit<ProviderService, "id">,
): Record<string, unknown> {
  const isFree = s.kind === "free_online";
  const consultationType = isFree ? "online" : s.isAmbulatory ? "in_person" : "online";
  return {
    clinic_id: Number(clinicId),
    doctor_id: Number(s.doctorId),
    service_name: s.title.trim(),
    category: categoryNameForApi(categories, s.categoryId),
    description: (s.description ?? "").trim() || null,
    price: isFree ? 0 : s.priceMnt,
    is_free_consultation: isFree,
    duration_minutes: s.durationMinutes,
    consultation_type: consultationType,
    is_active: s.isActive === false ? 0 : 1,
  };
}

/** Backend `PUT /services/:id` — нэгтгэсэн үйлчилгээний бүрэн төлөв. */
export function providerServiceToFullUpdateBody(
  categories: ProviderCategory[],
  merged: ProviderService,
): Record<string, unknown> {
  const isFree = merged.kind === "free_online";
  const consultationType = isFree ? "online" : merged.isAmbulatory ? "in_person" : "online";
  return {
    doctor_id: Number(merged.doctorId),
    service_name: merged.title.trim(),
    category: categoryNameForApi(categories, merged.categoryId),
    description: (merged.description ?? "").trim() || null,
    price: isFree ? 0 : merged.priceMnt,
    is_free_consultation: isFree,
    duration_minutes: merged.durationMinutes,
    consultation_type: consultationType,
    is_active: merged.isActive === false ? 0 : 1,
  };
}
