import { customerNestedStackScreenOptions } from "@/constants/navigationTheme";
import { useNavigationColorScheme } from "@/hooks/useNavigationColorScheme";
import { Stack } from "expo-router";

export default function ProviderLabTestsLayout() {
  const colorScheme = useNavigationColorScheme();
  return <Stack screenOptions={() => customerNestedStackScreenOptions(colorScheme)} />;
}
