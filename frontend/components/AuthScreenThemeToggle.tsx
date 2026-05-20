import { HeaderThemeToggleButton, type HeaderThemeToggleButtonProps } from "@/components/HeaderIconButtons";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = HeaderThemeToggleButtonProps;

/** Header байхгүй auth дэлгэц (танилцуулга, splash) — баруун дээд icon. */
export function AuthScreenThemeToggle({ variant = "default" }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        top: Math.max(insets.top, 8) + 4,
        right: 12,
        zIndex: 30,
      }}
    >
      <HeaderThemeToggleButton variant={variant} />
    </View>
  );
}
