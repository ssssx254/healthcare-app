import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_KEY_PREFIX = "api.get.cache.v1:";

type CacheRecord = {
  savedAt: number;
  payload: unknown;
};

export async function saveGetCache(key: string, payload: unknown): Promise<void> {
  const item: CacheRecord = {
    savedAt: Date.now(),
    payload,
  };
  await AsyncStorage.setItem(`${CACHE_KEY_PREFIX}${key}`, JSON.stringify(item));
}

export async function readGetCache<T>(key: string): Promise<{ savedAt: number; data: T } | null> {
  const raw = await AsyncStorage.getItem(`${CACHE_KEY_PREFIX}${key}`);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CacheRecord;
    return { savedAt: parsed.savedAt, data: parsed.payload as T };
  } catch {
    return null;
  }
}

export async function removeGetCache(key: string): Promise<void> {
  await AsyncStorage.removeItem(`${CACHE_KEY_PREFIX}${key}`);
}

/** POST/PATCH/DELETE дараа холбоотой GET кэшийг цэвэрлэнэ. */
export async function invalidateGetCachesForMutation(mutatedPath: string): Promise<void> {
  if (mutatedPath.startsWith("/chat")) {
    const allKeys = await AsyncStorage.getAllKeys();
    const toRemove = allKeys.filter(
      (k) => k.startsWith(CACHE_KEY_PREFIX) && k.includes("GET:/chat"),
    );
    if (toRemove.length > 0) await AsyncStorage.multiRemove(toRemove);
    return;
  }

  if (mutatedPath.startsWith("/provider-onboarding/logo") || mutatedPath.startsWith("/clinics")) {
    const allKeys = await AsyncStorage.getAllKeys();
    const toRemove = allKeys.filter(
      (k) => k.startsWith(CACHE_KEY_PREFIX) && k.includes("GET:/clinics"),
    );
    if (toRemove.length > 0) await AsyncStorage.multiRemove(toRemove);
    if (!mutatedPath.startsWith("/clinics")) return;
  }

  if (mutatedPath.startsWith("/consultations")) {
    const allKeys = await AsyncStorage.getAllKeys();
    const toRemove = allKeys.filter(
      (k) => k.startsWith(CACHE_KEY_PREFIX) && k.includes("GET:/consultations"),
    );
    if (toRemove.length > 0) await AsyncStorage.multiRemove(toRemove);
    return;
  }

  const doctorMatch = mutatedPath.match(/^\/doctors\/([^/]+)/);
  if (!doctorMatch) return;
  const doctorId = doctorMatch[1];
  const needle = `/doctors/${doctorId}`;
  const featuredNeedle = "/doctors/featured";
  const doctorsListNeedle = "GET:/doctors";
  const allKeys = await AsyncStorage.getAllKeys();
  const toRemove = allKeys.filter((k) => {
    if (!k.startsWith(CACHE_KEY_PREFIX)) return false;
    const logical = k.slice(CACHE_KEY_PREFIX.length);
    if (!logical.startsWith(doctorsListNeedle)) return false;
    if (logical.includes(needle) || logical.includes(featuredNeedle)) return true;
    if (logical === "GET:/doctors" || logical.startsWith("GET:/doctors?")) return true;
    return false;
  });
  if (toRemove.length > 0) {
    await AsyncStorage.multiRemove(toRemove);
  }
}
