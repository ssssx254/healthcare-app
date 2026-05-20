import { customerNestedStackScreenOptions } from "@/constants/navigationTheme";
import { Stack } from "expo-router";
import { useNavigationColorScheme } from "@/hooks/useNavigationColorScheme";

export default function CustomerProfileStackLayout() {
  const colorScheme = useNavigationColorScheme();
  return (
    <Stack
      screenOptions={() => ({
        ...customerNestedStackScreenOptions(colorScheme),
        headerTitleAlign: "left",
      })}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}
