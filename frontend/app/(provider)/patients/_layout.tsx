import { customerNestedStackScreenOptions } from "@/constants/navigationTheme";
import { Stack } from "expo-router";
import { useNavigationColorScheme } from "@/hooks/useNavigationColorScheme";

export default function ProviderPatientsStackLayout() {
  const colorScheme = useNavigationColorScheme();
  return <Stack screenOptions={() => customerNestedStackScreenOptions(colorScheme)} />;
}
