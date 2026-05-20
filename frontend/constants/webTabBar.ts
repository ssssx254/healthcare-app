import { Platform } from "react-native";

/** Web tab bar: icon + label + safe area (native 72px өөр). */
export const WEB_TAB_BAR_MIN_HEIGHT = 96;
export const WEB_TAB_BAR_PADDING_TOP = 8;
export const WEB_TAB_BAR_BASE_PADDING_BOTTOM = 20;

/** Scroll content clears tab bar on web. */
export function getWebTabBarScrollBottomPadding(safeAreaBottom = 0): number {
  return WEB_TAB_BAR_MIN_HEIGHT + WEB_TAB_BAR_BASE_PADDING_BOTTOM + Math.max(0, safeAreaBottom) + 12;
}

export function isWebPlatform(): boolean {
  return Platform.OS === "web";
}

export function getWebTabBarPaddingBottom(safeAreaBottom = 0): number {
  return WEB_TAB_BAR_BASE_PADDING_BOTTOM + Math.max(0, safeAreaBottom);
}

export function getWebTabBarMinHeight(safeAreaBottom = 0): number {
  return WEB_TAB_BAR_MIN_HEIGHT + Math.max(0, safeAreaBottom);
}
