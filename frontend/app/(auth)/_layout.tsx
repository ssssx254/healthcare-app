import { HeaderThemeToggleButton } from "@/components";
import { WebScreenFrame } from "@/components/WebScreenFrame";
import { authStackScreenOptions } from "@/constants/navigationTheme";
import { Stack } from "expo-router";
import { useNavigationColorScheme } from "@/hooks/useNavigationColorScheme";
import { useMemo } from "react";

export default function AuthGroupLayout() {
  const colorScheme = useNavigationColorScheme();
  const screenOptions = useMemo(
    () => ({
      ...authStackScreenOptions(colorScheme),
      headerRight: () => <HeaderThemeToggleButton />,
    }),
    [colorScheme],
  );
  return (
    <WebScreenFrame>
      <Stack screenOptions={screenOptions}>
      <Stack.Screen name="splash" options={{ headerShown: false }} />
      <Stack.Screen name="intro" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ title: "Нэвтрэх" }} />
      <Stack.Screen name="forgot-password" options={{ title: "Нууц үг мартсан" }} />
      <Stack.Screen name="reset-password" options={{ title: "Нууц үг шинэчлэх" }} />
      <Stack.Screen name="reset-password-success" options={{ title: "Заавар илгээгдлээ" }} />
      <Stack.Screen name="provider-pending" options={{ title: "Бүртгэл шалгалтад байна" }} />
      <Stack.Screen name="register" options={{ title: "Бүртгүүлэх" }} />
    </Stack>
    </WebScreenFrame>
  );
}