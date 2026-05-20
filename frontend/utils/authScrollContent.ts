import { Platform, type StyleProp, type ViewStyle } from "react-native";

/** Stack header байхгүй auth дэлгэц (intro) — status bar-аас доош зай. */
export function authHeaderlessScrollContent(
  topInset: number,
  base?: StyleProp<ViewStyle>,
): StyleProp<ViewStyle> {
  const topPad = Math.max(topInset, Platform.OS === "web" ? 12 : 0) + 20;

  return [
    base,
    {
      flexGrow: 1,
      paddingHorizontal: 20,
      paddingTop: topPad,
      paddingBottom: 36,
    },
  ];
}
