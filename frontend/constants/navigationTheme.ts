import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { Platform, type ColorSchemeName } from "react-native";
import { colors } from "@/constants/theme";
import { nativeStackScreenDefaults } from "@/constants/navigationScreenOptions";
import {
  getWebTabBarMinHeight,
  getWebTabBarPaddingBottom,
  isWebPlatform,
  WEB_TAB_BAR_PADDING_TOP,
} from "@/constants/webTabBar";

function paletteFor(scheme: ColorSchemeName | null | undefined) {
  return colors[scheme === "light" ? "light" : "dark"];
}

/** Үйлчлүүлэгчийн tab header-тай ижил өнгө — nested Stack дээр давхардахгүйн тулд. */
export function customerHeaderOptions(
  scheme: ColorSchemeName | null | undefined,
): Pick<NativeStackNavigationOptions, "headerStyle" | "headerTintColor" | "headerTitleStyle"> {
  const p = paletteFor(scheme);
  return {
    headerStyle: {
      backgroundColor: p.headerBg,
      elevation: 0,
      shadowOpacity: 0,
      borderBottomWidth: 1,
      borderBottomColor: p.border,
    } as NativeStackNavigationOptions["headerStyle"],
    headerTintColor: p.textSecondary,
    headerTitleStyle: {
      fontWeight: "700" as const,
      fontSize: 17,
      color: p.text,
    },
  };
}

/** Захиалга / профайл зэрэг tab доторх Stack — swipe-back + ижил header. */
export function customerNestedStackScreenOptions(
  scheme: ColorSchemeName | null | undefined,
): NativeStackNavigationOptions {
  const p = paletteFor(scheme);
  return {
    ...nativeStackScreenDefaults,
    ...customerHeaderOptions(scheme),
    contentStyle: {
      backgroundColor: p.background,
    },
  };
}

/** Нэвтрэх / бүртгэлийн Stack — dark/light. */
export function authStackScreenOptions(scheme: ColorSchemeName | null | undefined): NativeStackNavigationOptions {
  const p = paletteFor(scheme);
  return {
    ...nativeStackScreenDefaults,
    headerStyle: {
      backgroundColor: p.headerBg,
    },
    headerTintColor: p.textSecondary,
    headerTitleStyle: {
      ...(typeof nativeStackScreenDefaults.headerTitleStyle === "object" && nativeStackScreenDefaults.headerTitleStyle
        ? nativeStackScreenDefaults.headerTitleStyle
        : {}),
      color: p.text,
      fontWeight: "700",
    },
    contentStyle: {
      backgroundColor: p.background,
    },
  };
}

export type TabScreenOptionsParams = {
  webMobileLayout?: boolean;
  safeAreaBottom?: number;
};

/** Tabs + stack header — light/dark нийцтэй, Expo Go-д native модульгүй. */
export function tabScreenOptions(
  scheme: ColorSchemeName | null | undefined,
  params: TabScreenOptionsParams = {},
) {
  const p = paletteFor(scheme);
  const useWebTabBar = isWebPlatform();
  const safeBottom = Math.max(0, params.safeAreaBottom ?? 0);

  const nativeTabBar = {
    height: 72,
    paddingTop: 8,
    paddingBottom: 12,
  };

  const webTabBar = {
    minHeight: getWebTabBarMinHeight(safeBottom),
    paddingTop: WEB_TAB_BAR_PADDING_TOP,
    paddingBottom: getWebTabBarPaddingBottom(safeBottom),
  };

  return {
    ...customerHeaderOptions(scheme),
    tabBarActiveTintColor: p.brand,
    tabBarInactiveTintColor: p.iconMuted,
    tabBarLabelStyle: {
      fontSize: 11,
      fontWeight: "700" as const,
      marginBottom: useWebTabBar ? 4 : 1,
      marginTop: useWebTabBar ? 2 : 0,
    },
    tabBarIconStyle: useWebTabBar ? { marginTop: 2 } : undefined,
    tabBarStyle: {
      ...(useWebTabBar ? webTabBar : nativeTabBar),
      backgroundColor: p.tabBarBg,
      borderTopWidth: 1,
      borderTopColor: p.tabBarBorder,
      elevation: 10,
      shadowColor: "#020617",
      shadowOpacity: scheme === "light" ? 0.08 : 0.28,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: -2 },
      ...Platform.select({
        web: { flexShrink: 0 as const },
        default: {},
      }),
    },
    tabBarItemStyle: {
      paddingVertical: useWebTabBar ? 6 : 2,
      justifyContent: "center" as const,
    },
    tabBarAllowFontScaling: false,
  };
}
