import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { BottomTabBar } from "@react-navigation/bottom-tabs";
import { Platform, View } from "react-native";

/**
 * Web: tab bar wrapper — safe-area + min-height via global.css `.web-tab-bar-root`.
 * Native: BottomTabBar шууд (Expo Go өөрчлөгдөхгүй).
 */
export function WebBottomTabBar(props: BottomTabBarProps) {
  if (Platform.OS !== "web") {
    return <BottomTabBar {...props} />;
  }

  return (
    <View className="web-tab-bar-root" style={{ flexShrink: 0, overflow: "visible" }}>
      <BottomTabBar {...props} />
    </View>
  );
}
