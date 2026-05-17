import { isWeb } from "@/constants/webLayout";
import type { StyleProp, ViewStyle } from "react-native";

/** Vertically centers auth forms inside the mobile column on web only. */
export function webAuthScrollContent(
  base: StyleProp<ViewStyle> = undefined,
): StyleProp<ViewStyle> {
  if (!isWeb) return base;
  return [base, { flexGrow: 1, justifyContent: "center", paddingVertical: 24 }];
}
