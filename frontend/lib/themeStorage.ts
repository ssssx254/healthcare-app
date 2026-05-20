import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AppThemeMode } from "@/constants/theme";

const THEME_STORAGE_KEY = "@medeasy/theme_mode";

export async function loadStoredTheme(): Promise<AppThemeMode | null> {
  try {
    const raw = await AsyncStorage.getItem(THEME_STORAGE_KEY);
    if (raw === "light" || raw === "dark") return raw;
    return null;
  } catch {
    return null;
  }
}

export async function saveStoredTheme(mode: AppThemeMode): Promise<void> {
  try {
    await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
}
