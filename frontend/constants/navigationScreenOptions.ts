import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { Platform } from "react-native";

/**
 * iOS: ирмэгээс биш дэлгэцийн ихэнх хэсгээс swipe-back (native stack).
 * Android: системийн predictive back-тай уялдуулсан native stack (гар жест нь ихэвчлэн идэвхгүй).
 */
const nativeStackGestureDefaults: NativeStackNavigationOptions = {
  gestureEnabled: true,
  gestureDirection: "horizontal",
  animation: "slide_from_right",
  ...(Platform.OS === "ios"
    ? {
        // Back swipe only from left edge, but keep it usable.
        fullScreenGestureEnabled: false,
        gestureResponseDistance: { start: 28 },
        animationMatchesGesture: true,
      }
    : {}),
};

/**
 * Stack header defaults: буцах товч дээр зөвхөн сум (текстгүй), Android дээр гарчиг төвд.
 */
export const nativeStackScreenDefaults: NativeStackNavigationOptions = {
  ...nativeStackGestureDefaults,
  headerBackButtonDisplayMode: "minimal",
  headerBackTitle: "",
  headerTitleStyle: { fontWeight: "600" },
  headerTitleAlign: "left",
};
