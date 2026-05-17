import { customerNestedStackScreenOptions } from "@/constants/navigationTheme";
import { Stack } from "expo-router";
import { useColorScheme } from "react-native";

export default function CustomerProfileStackLayout() {
  const colorScheme = useColorScheme();
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
