import { routes } from "@/constants/appRoutes";
import { tabScreenOptions } from "@/constants/navigationTheme";
import { useAuth } from "@/hooks/useAuth";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Redirect, Tabs, router } from "expo-router";
import { Pressable, useColorScheme } from "react-native";

export default function SystemAdminLayout() {
  const { isAuthenticated, user, authLoading } = useAuth();
  const colorScheme = useColorScheme();

  if (authLoading) return null;
  if (!isAuthenticated || user?.role !== "system_admin") {
    return <Redirect href={routes.login} />;
  }

  return (
    <Tabs
      screenOptions={() => ({
        ...tabScreenOptions(colorScheme),
        headerTitle: "",
        headerShown: true,
        headerLeft: () => (
          <Pressable onPress={() => router.push(routes.adminNotifications)} hitSlop={10} className="px-2 py-1">
            <MaterialCommunityIcons name="bell-outline" size={22} color={colorScheme === "dark" ? "#e2e8f0" : "#0f172a"} />
          </Pressable>
        ),
        headerRight: () => (
          <Pressable onPress={() => router.push(routes.adminProfile)} hitSlop={10} className="px-2 py-1">
            <MaterialCommunityIcons name="cog-outline" size={22} color={colorScheme === "dark" ? "#e2e8f0" : "#0f172a"} />
          </Pressable>
        ),
      })}
    >
      <Tabs.Screen
        name="admin-dashboard"
        options={{
          title: "Самбар",
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="view-dashboard-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="admin-registrations"
        options={{
          title: "Бүртгэл",
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="clipboard-check-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="admin-providers"
        options={{
          title: "Үзүүлэгч",
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="account-tie-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="admin-users"
        options={{
          title: "Хэрэглэгч",
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="account-group-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="admin-moderation"
        options={{
          title: "Хяналт",
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="shield-check-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="admin-profile"
        options={{
          href: null,
          title: "Тохиргоо",
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="cog-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="admin-notifications"
        options={{
          href: null,
          title: "Мэдэгдэл",
        }}
      />
    </Tabs>
  );
}

