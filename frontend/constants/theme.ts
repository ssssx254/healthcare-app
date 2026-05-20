/** Брэнд — primary товч, холбоос */
export const brandPrimary = "#2563EB";

/** Эрүүл мэндийн accent (teal) */
export const accentTeal = "#0d9488";
export const accentTealLight = "#14b8a6";

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 28,
  full: 9999,
} as const;

export const typography = {
  title: { fontSize: 22, fontWeight: "700" as const, lineHeight: 28 },
  subtitle: { fontSize: 16, fontWeight: "600" as const, lineHeight: 22 },
  body: { fontSize: 15, fontWeight: "400" as const, lineHeight: 22 },
  caption: { fontSize: 12, fontWeight: "500" as const, lineHeight: 18 },
  label: { fontSize: 11, fontWeight: "700" as const, lineHeight: 14 },
} as const;

export const shadows = {
  light: {
    card: {
      shadowColor: "#0f172a",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    sm: {
      shadowColor: "#0f172a",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
    },
  },
  dark: {
    card: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 14,
      elevation: 6,
    },
    sm: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 3,
    },
  },
} as const;

export type AppThemeMode = "light" | "dark";

export type ThemePalette = {
  background: string;
  surface: string;
  surfaceMuted: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderStrong: string;
  brand: string;
  brandMuted: string;
  accent: string;
  accentMuted: string;
  danger: string;
  dangerMuted: string;
  warning: string;
  warningMuted: string;
  success: string;
  successMuted: string;
  headerBg: string;
  tabBarBg: string;
  tabBarBorder: string;
  overlay: string;
  icon: string;
  iconMuted: string;
};

export const colors: Record<AppThemeMode, ThemePalette> = {
  light: {
    background: "#F5F7FB",
    surface: "#FFFFFF",
    surfaceMuted: "#EEF2F7",
    text: "#0B1F3A",
    textSecondary: "#334155",
    textMuted: "#64748B",
    border: "#E2E8F0",
    borderStrong: "#CBD5E1",
    brand: brandPrimary,
    brandMuted: "#DBEAFE",
    accent: accentTeal,
    accentMuted: "#CCFBF1",
    danger: "#DC2626",
    dangerMuted: "#FEE2E2",
    warning: "#D97706",
    warningMuted: "#FEF3C7",
    success: "#059669",
    successMuted: "#D1FAE5",
    headerBg: "#FFFFFF",
    tabBarBg: "#FFFFFF",
    tabBarBorder: "#DBE3EF",
    overlay: "rgba(15, 23, 42, 0.45)",
    icon: "#475569",
    iconMuted: "#94A3B8",
  },
  dark: {
    background: "#020617",
    surface: "#0F172A",
    surfaceMuted: "#1E293B",
    text: "#F8FAFC",
    textSecondary: "#E2E8F0",
    textMuted: "#94A3B8",
    border: "#1E293B",
    borderStrong: "#334155",
    brand: "#60A5FA",
    brandMuted: "#1E3A5F",
    accent: accentTealLight,
    accentMuted: "#134E4A",
    danger: "#F87171",
    dangerMuted: "#7F1D1D",
    warning: "#FBBF24",
    warningMuted: "#78350F",
    success: "#34D399",
    successMuted: "#064E3B",
    headerBg: "#0F172A",
    tabBarBg: "#0B1220",
    tabBarBorder: "#1F2A3A",
    overlay: "rgba(0, 0, 0, 0.55)",
    icon: "#CBD5E1",
    iconMuted: "#64748B",
  },
};

export type ColorSchemeName = AppThemeMode;

/** @deprecated colors.light / colors.dark ашиглана */
export const appName = "MedEasy";
