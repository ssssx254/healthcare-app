import "../global.css";
import {
  AppContainer,
  OfflineBanner,
  PushNotificationBootstrap,
  ReconnectAutoRefresh,
  ThemeProvider,
  VectorIconFontLoader,
} from "@/components";
import { nativeStackScreenDefaults } from "@/constants/navigationScreenOptions";
import { AuthProvider } from "@/hooks/useAuth";
import { NetworkProvider } from "@/hooks/useNetworkStatus";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NetworkProvider>
          <ThemeProvider>
            <AuthProvider>
              <VectorIconFontLoader>
                <OfflineBanner />
                <PushNotificationBootstrap />
                <ReconnectAutoRefresh />
                <AppContainer shell className="flex-1">
                  <Stack screenOptions={nativeStackScreenDefaults}>
                    <Stack.Screen name="index" options={{ headerShown: false }} />
                    <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                    <Stack.Screen name="(customer)" options={{ headerShown: false }} />
                    <Stack.Screen name="(provider)" options={{ headerShown: false }} />
                    <Stack.Screen name="(system-admin)" options={{ headerShown: false }} />
                  </Stack>
                </AppContainer>
              </VectorIconFontLoader>
            </AuthProvider>
          </ThemeProvider>
        </NetworkProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
