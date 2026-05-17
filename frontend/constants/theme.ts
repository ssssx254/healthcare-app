/** Брэнд нэр (Expo `app.json` name-тай тааруулна). UI доторх гарчиг `copy`-оос. */
export const appName = "MedEasy";

/** Натив splash, товч, холбоос — нэг суурь өнгө */
export const brandPrimary = "#2563EB";

export const colors = {
  light: {
    background: "#f8fafc",
    surface: "#ffffff",
    text: "#0f172a",
    textMuted: "#64748b",
    border: "#e2e8f0",
    brand: brandPrimary,
    danger: "#dc2626",
  },
  dark: {
    background: "#020617",
    surface: "#0f172a",
    text: "#f8fafc",
    textMuted: "#94a3b8",
    border: "#1e293b",
    brand: "#60a5fa",
    danger: "#f87171",
  },
} as const;

export type ColorSchemeName = "light" | "dark";
