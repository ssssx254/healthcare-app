import { authStackScreenOptions } from "@/constants/navigationTheme";
import { Stack } from "expo-router";
import { useColorScheme } from "react-native";

export default function AuthGroupLayout() {
  const colorScheme = useColorScheme();
  return (
    <Stack screenOptions={() => authStackScreenOptions(colorScheme)}>
      <Stack.Screen name="splash" options={{ headerShown: false }} />
      <Stack.Screen name="intro" options={{ title: "Танилцуулга" }} />
      <Stack.Screen name="login" options={{ title: "Нэвтрэх" }} />
      <Stack.Screen name="forgot-password" options={{ title: "Нууц үг мартсан" }} />
      <Stack.Screen name="reset-password" options={{ title: "Нууц үг шинэчлэх" }} />
      <Stack.Screen name="reset-password-success" options={{ title: "Заавар илгээгдлээ" }} />
      <Stack.Screen name="provider-pending" options={{ title: "Бүртгэл шалгалтад байна" }} />
      <Stack.Screen name="register" options={{ title: "Бүртгүүлэх" }} />
    </Stack>
  );
}