import { AppContainer, AppIcon } from "@/components";
import { copy } from "@/constants/copy";
import { isWeb } from "@/constants/webLayout";
import { SPLASH_BACKGROUND } from "@/constants/splashTheme";
import { routes } from "@/constants/appRoutes";
import { useAuth } from "@/hooks/useAuth";
import { Link, Redirect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SplashScreen() {
  const { user, authLoading } = useAuth();
  const insets = useSafeAreaInsets();

  if (!authLoading && user?.role === "customer") {
    return <Redirect href={routes.customerHome} />;
  }
  if (!authLoading && user?.role === "provider") {
    return <Redirect href={routes.providerDashboard} />;
  }
  if (!authLoading && user?.role === "system_admin") {
    return <Redirect href={routes.systemAdminDashboard} />;
  }

  return (
    <AppContainer centerContent className="flex-1" style={{ backgroundColor: SPLASH_BACKGROUND }}>
      <StatusBar style="light" />
      <View className="flex-1 items-center justify-center px-8">
        <View className="mb-2 h-24 w-24 items-center justify-center rounded-3xl bg-white/10">
          <AppIcon name="stethoscope" size={56} color="#ffffff" />
        </View>
        <Text
          className={`mt-4 text-center font-bold leading-8 text-white ${isWeb ? "text-xl" : "text-2xl"}`}
          accessibilityRole="header"
        >
          {copy.common.appTitle}
        </Text>
        <Text className="mt-3 max-w-sm text-center text-base leading-6 text-white/90" numberOfLines={4}>
          {copy.common.tagline}
        </Text>
      </View>
      <View
        style={{ paddingBottom: Math.max(insets.bottom, 24) + 8 }}
        className={`px-8 ${isWeb ? "w-full max-w-sm self-center pb-6" : ""}`}
      >
        <Link href={routes.intro} asChild>
          <Pressable className="w-full rounded-2xl bg-white py-4 active:opacity-90">
            <Text className="text-center text-base font-bold text-brand-700">Эхлэх</Text>
          </Pressable>
        </Link>
        <Link href={routes.login} asChild>
          <Pressable className="mt-3 w-full rounded-2xl border-2 border-white/90 py-3.5 active:bg-white/10">
            <Text className="text-center text-base font-semibold text-white">Нэвтрэх</Text>
          </Pressable>
        </Link>
      </View>
    </AppContainer>
  );
}
