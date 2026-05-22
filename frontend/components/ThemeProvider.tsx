import { colors, type AppThemeMode, type ThemePalette } from "@/constants/theme";
import { loadStoredTheme, saveStoredTheme } from "@/lib/themeStorage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Appearance, Platform, View } from "react-native";
import { StatusBar } from "expo-status-bar";

type ThemeContextValue = {
  theme: AppThemeMode;
  resolvedScheme: AppThemeMode;
  palette: ThemePalette;
  setTheme: (mode: AppThemeMode) => void;
  toggleTheme: () => void;
  /** @deprecated setTheme ашиглана */
  preference: AppThemeMode;
  setPreference: (mode: AppThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyNativeWindScheme(mode: AppThemeMode) {
  const setColorScheme = (Appearance as unknown as { setColorScheme?: (v: "light" | "dark" | null) => void })
    .setColorScheme;
  if (typeof setColorScheme === "function") {
    setColorScheme(mode);
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AppThemeMode>("dark");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    void loadStoredTheme().then((stored) => {
      if (!mounted) return;
      const initial = stored ?? "dark";
      setThemeState(initial);
      applyNativeWindScheme(initial);
      setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    document.body.style.backgroundColor = colors[theme].background;
  }, [theme]);

  const setTheme = useCallback((mode: AppThemeMode) => {
    setThemeState(mode);
    applyNativeWindScheme(mode);
    void saveStoredTheme(mode);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      applyNativeWindScheme(next);
      void saveStoredTheme(next);
      return next;
    });
  }, []);

  const palette = colors[theme];

  const value = useMemo(
    (): ThemeContextValue => ({
      theme,
      resolvedScheme: theme,
      palette,
      setTheme,
      toggleTheme,
      preference: theme,
      setPreference: setTheme,
    }),
    [theme, palette, setTheme, toggleTheme],
  );

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: colors.dark.background }} />;
  }

  return (
    <ThemeContext.Provider value={value}>
      <View
        className={theme === "dark" ? "dark flex-1" : "flex-1"}
        style={{ flex: 1, backgroundColor: palette.background }}
      >
        <StatusBar style={theme === "dark" ? "light" : "dark"} />
        {children}
      </View>
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
