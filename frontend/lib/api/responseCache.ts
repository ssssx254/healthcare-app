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
