import { routes } from "@/constants/appRoutes";
import { HeaderChatLink, HeaderNotificationLink } from "@/components";
import { ProviderWorkspaceProvider } from "@/contexts/ProviderWorkspaceContext";
import { tabScreenOptions } from "@/constants/navigationTheme";
import { useAuth } from "@/hooks/useAuth";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { useColorScheme, View } from "react-native";

export default function ProviderGroupLayout() {
  const { isAuthenticated, user, authLoading } = useAuth();
  const colorScheme = useColorScheme();

  if (authLoading) return null;
  if (!isAuthenticated || user?.role !== "provider") {
    return <Redirect href={routes.login} />;
  }

  return (
    <ProviderWorkspaceProvider>
      <Tabs
        screenOptions={() => ({
          ...tabScreenOptions(colorScheme),
          headerTitle: "",
          headerLeft: () => (
            <View className="ml-1 flex-row items-center">
              <HeaderNotificationLink href={routes.providerNotifications} />
              <HeaderChatLink href={routes.providerChat} />
            </View>
          ),
        })}
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            title: "Самбар",
            tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="view-dashboard-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="bookings"
          options={{
            title: "Захиалга",
            tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="clipboard-text-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="services"
          options={{
            title: "Үйлчилгээ",
            tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="briefcase-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: "Чат",
            href: null,
            tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="chat-processing-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen name="chat-detail" options={{ href: null }} />
        <Tabs.Screen
          name="provider-profile"
          options={{
            title: "Профайл",
            tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="account-circle-outline" size={size} color={color} />,
          }}
        />

        <Tabs.Screen name="orders" options={{ href: null }} />
        <Tabs.Screen name="schedule" options={{ href: null }} />
        <Tabs.Screen name="patients" options={{ href: null }} />
        <Tabs.Screen name="clinic-register" options={{ href: null }} />
        <Tabs.Screen name="clinic-profile" options={{ href: null }} />
        <Tabs.Screen name="clinic-edit" options={{ href: null }} />
        <Tabs.Screen name="provider-change-password" options={{ href: null }} />
        <Tabs.Screen name="doctor-register" options={{ href: null }} />
        <Tabs.Screen name="doctors" options={{ href: null }} />
        <Tabs.Screen name="categories" options={{ href: null }} />
        <Tabs.Screen name="revenue" options={{ href: null }} />
        <Tabs.Screen name="provider-notifications" options={{ href: null }} />
        <Tabs.Screen name="notification-settings" options={{ href: null }} />
        <Tabs.Screen name="doctor/[doctorId]/edit" options={{ href: null }} />
      </Tabs>
    </ProviderWorkspaceProvider>
  );
}
