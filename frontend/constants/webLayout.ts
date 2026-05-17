import { Platform } from "react-native";

/** Mobile-app column width on web (430–480px range). */
export const APP_MAX_WIDTH = 480;

/** Outer gutter on web so content does not touch viewport edges on narrow tablets. */
export const WEB_HORIZONTAL_GUTTER = 16;

/** Desktop/tablet backdrop behind the centered app column. */
export const WEB_SHELL_BACKGROUND = "#e8eef4";
export const WEB_SHELL_BACKGROUND_DARK = "#0f172a";

/** Breakpoints (px) for optional web-only tweaks. */
export const WEB_BREAKPOINT_TABLET = 768;
export const WEB_BREAKPOINT_DESKTOP = 1024;

export const isWeb = Platform.OS === "web";

export type WebBreakpoint = "mobile" | "tablet" | "desktop";

export function getWebBreakpoint(viewportWidth: number): WebBreakpoint {
  if (viewportWidth >= WEB_BREAKPOINT_DESKTOP) return "desktop";
  if (viewportWidth >= WEB_BREAKPOINT_TABLET) return "tablet";
  return "mobile";
}
