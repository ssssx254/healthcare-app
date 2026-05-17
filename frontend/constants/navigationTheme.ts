import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import type { ColorSchemeName } from "react-native";
import { nativeStackScreenDefaults } from "@/constants/navigationScreenOptions";

/** Үйлчлүүлэгчийн tab header-тай ижил өнгө — nested Stack дээр давхардахгүйн тулд. */
export function customerHeaderOptions(
  scheme: ColorSchemeName | null | undefined,
): Pick<NativeStackNavigationOptions, "headerStyle" | "headerTintColor" | "headerTitleStyle"> {
  const dark = scheme === "dark";
  return {
    headerStyle: {
      backgroundColor: dark ? "#0f172a" : "#ffffff",
      elevation: 0,
      shadowOpacity: 0,
      borderBottomWidth: 1,
      borderBottomColor: dark ? "#1e293b" : "#f1f5f9",
    } as NativeStackNavigationOptions["headerStyle"],
    headerTintColor: dark ? "#e2e8f0" : "#0f172a",
    headerTitleStyle: {
      fontWeight: "700" as const,
      fontSize: 17,
      color: dark ? "#f8fafc" : "#0f172a",
    },
  };
}

/** Захиалга / профайл зэрэг tab доторх Stack — swipe-back + ижил header. */
export function customerNestedStackScreenOptions(
  scheme: ColorSchemeName | null | undefined,
): NativeStackNavigationOptions {
  const dark = scheme === "dark";
  return {
    ...nativeStackScreenDefaults,
    ...customerHeaderOptions(scheme),
    contentStyle: {
      backgroundColor: dark ? "#020617" : "#f8fafc",
    },
  };
}

/** Нэвтрэх / бүртгэлийн Stack — dark/light. */
export function authStackScreenOptions(scheme: ColorSchemeName | null | undefined): NativeStackNavigationOptions {
  const dark = scheme === "dark";
  return {
    ...nativeStackScreenDefaults,
    headerStyle: {
      backgroundColor: dark ? "#0f172a" : "#ffffff",
    },
    headerTintColor: dark ? "#e2e8f0" : "#1e293b",
    headerTitleStyle: {
      ...(typeof nativeStackScreenDefaults.headerTitleStyle === "object" && nativeStackScreenDefaults.headerTitleStyle
        ? nativeStackScreenDefaults.headerTitleStyle
        : {}),
      color: dark ? "#f8fafc" : "#0f172a",
      fontWeight: "700",
    },
    contentStyle: {
      backgroundColor: dark ? "#020617" : "#f8fafc",
    },
  };
}

/** Tabs + stack header — light/dark нийцтэй, Expo Go-д native модульгүй. */
export function tabScreenOptions(scheme: ColorSchemeName | null | undefined) {
  const dark = scheme === "dark";
  return {
    ...customerHeaderOptions(scheme),
    tabBarActiveTintColor: "#2563eb" as const,
    tabBarInactiveTintColor: dark ? "#a3b4cc" : "#64748b",
    tabBarLabelStyle: { fontSize: 11, fontWeight: "700" as const, marginBottom: 1 },
    tabBarStyle: {
      height: 72,
      paddingTop: 8,
      paddingBottom: 12,
      backgroundColor: dark ? "#0b1220" : "#ffffff",
      borderTopWidth: 1,
      borderTopColor: dark ? "#1f2a3a" : "#dbe3ef",
      elevation: 10,
      shadowColor: "#020617",
      shadowOpacity: dark ? 0.28 : 0.08,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: -2 },
    },
    tabBarItemStyle: {
      paddingVertical: 2,
    },
  };
}
