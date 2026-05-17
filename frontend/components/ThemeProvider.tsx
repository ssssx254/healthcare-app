import { colors } from "@/constants/theme";
import type { ThemePreference } from "@/types";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Appearance, useColorScheme as useSystemColorScheme } from "react-native";
import { StatusBar } from "expo-status-bar";

type ResolvedScheme = "light" | "dark";

type Palette = (typeof colors)["light"] | (typeof colors)["dark"];

type ThemeContextValue = {
  preference: ThemePreference;
  setPreference: (value: ThemePreference) => void;
  resolvedScheme: ResolvedScheme;
  palette: Palette;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const navigationLight = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.light.brand,
    background: colors.light.background,
    card: colors.light.surface,
    text: colors.light.text,
    border: colors.light.border,
  },
};

const navigationDark = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.dark.brand,
    background: colors.dark.background,
    card: colors.dark.surface,
    text: colors.dark.text,
    border: colors.dark.border,
  },
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useSystemColorScheme() ?? "light";
  const [preference, setPreferenceState] = useState<ThemePreference>("system");

  const resolvedScheme: ResolvedScheme =
    preference === "system" ? (system === "dark" ? "dark" : "light") : preference;

  useEffect(() => {
    // Web дээр `Appearance.setColorScheme` байхгүй (RN Web), тиймээс зөвхөн боломжтой үед нь дуудна.
    const setColorScheme = (Appearance as unknown as { setColorScheme?: (v: "light" | "dark" | null) => void }).setColorScheme;
    if (typeof setColorScheme !== "function") return;
    if (preference === "system") {
      setColorScheme(null);
    } else {
      setColorScheme(preference);
    }
  }, [preference]);

  const setPreference = useCallback((value: ThemePreference) => {
    setPreferenceState(value);
  }, []);

  const palette = resolvedScheme === "dark" ? colors.dark : colors.light;

  const value = useMemo(
    () => ({
      preference,
      setPreference,
      resolvedScheme,
      palette,
    }),
    [preference, setPreference, resolvedScheme, palette],
  );

  const navTheme = resolvedScheme === "dark" ? navigationDark : navigationLight;

  return (
    <ThemeContext.Provider value={value}>
      <NavigationThemeProvider value={navTheme}>
        <StatusBar style={resolvedScheme === "dark" ? "light" : "dark"} />
        {children}
      </NavigationThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useAppTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useAppTheme нь ThemeProvider дотор ашиглагдана.");
  }
  return ctx;
}
