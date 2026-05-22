import type { ProviderCategory } from "@/types/provider";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { dedupeCategoryIds } from "@/lib/categoryId";

const storageKey = (clinicId: string) => `@medeasy/provider_categories/${clinicId}`;

export async function loadProviderCategories(clinicId: string): Promise<ProviderCategory[]> {
  if (!clinicId) return [];
  try {
    const raw = await AsyncStorage.getItem(storageKey(clinicId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const rows = parsed
      .filter((x): x is ProviderCategory => typeof x === "object" && x != null && "id" in x && "name" in x)
      .map((x) => ({ id: String(x.id), name: String(x.name).trim() }))
      .filter((x) => x.name.length > 0);
    return dedupeCategoryIds(rows);
  } catch {
    return [];
  }
}

export async function saveProviderCategories(clinicId: string, categories: ProviderCategory[]): Promise<void> {
  if (!clinicId) return;
  try {
    await AsyncStorage.setItem(storageKey(clinicId), JSON.stringify(dedupeCategoryIds(categories)));
  } catch {
    /* ignore */
  }
}

/** Хадгалсан + үйлчилгээнээс ирсэн ангиллуудыг нэгтгэнэ (нэрээр давхардуулахгүй). */
export function mergeProviderCategories(
  persisted: ProviderCategory[],
  fromServices: ProviderCategory[],
): ProviderCategory[] {
  const byName = new Map<string, ProviderCategory>();
  for (const c of fromServices) {
    const key = c.name.trim().toLowerCase();
    if (key) byName.set(key, c);
  }
  for (const c of persisted) {
    const key = c.name.trim().toLowerCase();
    if (key) byName.set(key, c);
  }
  return dedupeCategoryIds(Array.from(byName.values()));
}
