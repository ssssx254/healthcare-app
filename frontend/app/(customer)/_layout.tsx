import { routes } from "@/constants/appRoutes";
import { CustomerBookingProvider } from "@/contexts/CustomerBookingContext";
import {
  HeaderChatLink,
  HeaderEmergencyCallButton,
  HeaderThemeAndLogout,
  HeaderNotificationLink,
} from "@/components";
import { WebBottomTabBar } from "@/components/WebBottomTabBar";
import { WebScreenFrame } from "@/components/WebScreenFrame";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAuth } from "@/hooks/useAuth";
import { useTabScreenOptions } from "@/hooks/useTabScreenOptions";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { View } from "react-native";

export default function CustomerGroupLayout() {
  const { palette } = useAppTheme();
  const { isAuthenticated, user, authLoading, signOut } = useAuth();
  const tabOptions = useTabScreenOptions();

  if (authLoading) return null;
  if (!isAuthenticated || user?.role !== "customer") {
    return <Redirect href={routes.login} />;
  }

  return (
    <CustomerBookingProvider>
      <WebScreenFrame>
      <Tabs
        tabBar={(props) => <WebBottomTabBar {...props} />}
        screenOptions={() => ({
          ...tabOptions,
          headerTitle: "",
          headerLeft: () => (
            <View className="ml-1 flex-row items-center">
              <HeaderNotificationLink href={routes.customerNotifications} />
              <HeaderChatLink href={routes.customerChat} />
              <HeaderEmergencyCallButton />
            </View>
          ),
          headerRight: () => <HeaderThemeAndLogout onPress={signOut} />,
        })}
      >
        <Tabs.Screen
          name="home"
          options={{
            tabBarLabel: "Нүүр",
            headerTitle: "",
            tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="home-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="doctors"
          options={{
            tabBarLabel: "Эмч нар",
            headerTitle: "",
            tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="doctor" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="appointments"
          options={{
            tabBarLabel: "Цаг захиалга",
            headerTitle: "",
            tabBarIcon: ({ focused }) => (
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: focused ? palette.brand : palette.brandMuted,
                }}
              >
                <MaterialCommunityIcons
                  name="calendar-check-outline"
                  size={22}
                  color={focused ? "#ffffff" : palette.brand}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="consultations"
          options={{
            tabBarLabel: "Шинжилгээ",
            headerTitle: "",
            tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="flask-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            tabBarLabel: "Профайл",
            headerTitle: "",
            tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="account-circle-outline" size={size} color={color} />,
          }}
        />

        <Tabs.Screen name="clinics" options={{ href: null }} />
        <Tabs.Screen name="notifications" options={{ href: null }} />
        <Tabs.Screen name="notification-settings" options={{ href: null }} />
        <Tabs.Screen name="chat" options={{ href: null, tabBarStyle: { display: "none" } }} />
        <Tabs.Screen name="chat-detail" options={{ href: null, tabBarStyle: { display: "none" } }} />
        <Tabs.Screen name="advice" options={{ href: null }} />
        <Tabs.Screen name="search" options={{ href: null }} />
        <Tabs.Screen name="filters" options={{ href: null }} />
        <Tabs.Screen name="free-consult" options={{ href: null }} />
        <Tabs.Screen name="insurance" options={{ href: null }} />
        <Tabs.Screen name="lab-tests" options={{ href: null }} />
        <Tabs.Screen name="medical-results" options={{ href: null }} />
        <Tabs.Screen name="doctor-notes" options={{ href: null }} />
        <Tabs.Screen name="health-form" options={{ href: null }} />
        <Tabs.Screen name="my-orders" options={{ href: null }} />
        <Tabs.Screen name="booking" options={{ href: null }} />
        <Tabs.Screen name="wallet" options={{ href: null }} />
        <Tabs.Screen name="payment-methods" options={{ href: null }} />
        <Tabs.Screen name="clinic" options={{ href: null }} />
      </Tabs>
      </WebScreenFrame>
    </CustomerBookingProvider>
  );
}
