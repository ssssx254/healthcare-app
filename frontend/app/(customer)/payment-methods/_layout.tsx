import { customerNestedStackScreenOptions } from "@/constants/navigationTheme";
import { Stack } from "expo-router";
import { useNavigationColorScheme } from "@/hooks/useNavigationColorScheme";

export default function PaymentMethodsStackLayout() {
  const colorScheme = useNavigationColorScheme();
  return (
    <Stack screenOptions={() => customerNestedStackScreenOptions(colorScheme)}>
      <Stack.Screen name="index" options={{ title: "Төлбөрийн арга" }} />
      <Stack.Screen name="add-card" options={{ title: "Карт нэмэх" }} />
    </Stack>
  );
}
