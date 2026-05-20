import { MaterialCommunityIcons } from "@expo/vector-icons";
import { cn } from "@/utils/cn";
import type { ComponentProps } from "react";
import { Platform, Text, View } from "react-native";
import { useVectorIconFonts } from "./VectorIconFontLoader";

export type AppIconProps = ComponentProps<typeof MaterialCommunityIcons>;

/** Web-safe MaterialCommunityIcons with placeholder when font load fails. */
export function AppIcon({ name, size = 24, color = "#64748b", style, ...rest }: AppIconProps) {
  const { failed } = useVectorIconFonts();

  if (Platform.OS === "web" && failed) {
    return (
      <View
        style={{ width: size, height: size }}
        className={cn("items-center justify-center rounded-md dark:bg-slate-700")}
        accessibilityRole="image"
        accessibilityLabel={typeof name === "string" ? name : "icon"}
      >
        <Text style={{ fontSize: Math.max(10, size * 0.45), color, fontWeight: "700" }}>+</Text>
      </View>
    );
  }

  return <MaterialCommunityIcons name={name} size={size} color={color} style={style} {...rest} />;
}
