import { AUDIENCE_CATEGORIES } from "@/constants/audienceCategories";
import type { ServiceCategorySelection } from "@/types/serviceCategorySelection";
import type { MockDoctor } from "@/types/customer";

/** doctor_id -> үйлчилгээний ангиллын нэрүүд */
export function buildDoctorServiceCategories(
  services: { doctor_id?: number | string | null; category?: string | null; service_name?: string | null; is_active?: boolean | number | null }[],
): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const row of services) {
    if (row.is_active === 0 || row.is_active === false) continue;
    const doctorId = row.doctor_id != null ? String(row.doctor_id) : "";
    if (!doctorId) continue;
    const cat = String(row.category ?? "").trim();
    const name = String(row.service_name ?? "").trim();
    if (!map.has(doctorId)) map.set(doctorId, new Set());
    const set = map.get(doctorId)!;
    if (cat) set.add(cat);
    if (name) set.add(name);
  }
  return map;
}

function haystackForDoctor(doctor: MockDoctor, serviceTags: Set<string> | undefined): string {
  const parts = [doctor.specialty, doctor.bio, doctor.name, doctor.primaryFocus, doctor.subSpecialty];
  if (serviceTags) parts.push(...serviceTags);
  return parts.filter(Boolean).join(" ").toLowerCase();
}

const AUDIENCE_KEYWORDS: Record<string, string[]> = Object.fromEntries(
  AUDIENCE_CATEGORIES.map((c) => [c.id, [c.searchQuery, c.label.toLowerCase()]]),
);

function matchesKeywords(haystack: string, keywords: string[]): boolean {
  return keywords.some((kw) => {
    const k = kw.trim().toLowerCase();
    return k.length > 0 && haystack.includes(k);
  });
}

export function doctorMatchesCategorySelection(
  doctor: MockDoctor,
  selection: ServiceCategorySelection | null,
  doctorServiceCategories: Map<string, Set<string>>,
): boolean {
  if (!selection || selection.kind === "all") return true;

  const tags = doctorServiceCategories.get(doctor.id);
  const haystack = haystackForDoctor(doctor, tags);

  if (selection.kind === "specialty") {
    return matchesKeywords(haystack, selection.keywords);
  }

  if (selection.kind === "provider") {
    const needle = selection.name.trim().toLowerCase();
    if (!needle) return true;
    if (haystack.includes(needle)) return true;
    if (tags) {
      for (const t of tags) {
        if (t.toLowerCase().includes(needle) || needle.includes(t.toLowerCase())) return true;
      }
    }
    return doctor.specialty.toLowerCase().includes(needle);
  }

  const keywords = AUDIENCE_KEYWORDS[selection.id] ?? [selection.searchQuery];
  return matchesKeywords(haystack, keywords);
}
