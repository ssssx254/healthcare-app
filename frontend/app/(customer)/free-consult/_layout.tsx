import { customerNestedStackScreenOptions } from "@/constants/navigationTheme";
import { Stack } from "expo-router";
import { useNavigationColorScheme } from "@/hooks/useNavigationColorScheme";

export default function FreeConsultStackLayout() {
  const colorScheme = useNavigationColorScheme();
  return (
    <Stack screenOptions={() => customerNestedStackScreenOptions(colorScheme)}>
      <Stack.Screen name="index" options={{ title: "Үнэгүй зөвлөгөө" }} />
      <Stack.Screen name="book" options={{ title: "Хүсэлт илгээх" }} />
    </Stack>
  );
}
