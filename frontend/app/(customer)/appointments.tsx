import { Badge, Button, Card, EmptyState, ErrorState, LoadingState, ScreenScrollView, SectionHeader } from "@/components";
import { orderStatusLabel, type OrderUiStatus } from "@/constants/orderStatus";
import { useCustomerBooking } from "@/contexts/CustomerBookingContext";
import { Link, Tabs, router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

type HistoryTab = "online" | "ambulatory";

function statusTone(s: OrderUiStatus): "brand" | "neutral" | "success" | "warning" {
  if (s === "confirmed" || s === "free_consult") return "success";
  if (s === "payment_required" || s === "pending") return "warning";
  if (s === "cancelled") return "neutral";
  return "brand";
}

export default function AppointmentsScreen() {
  const { orders, ordersLoading, ordersError, refreshOrders } = useCustomerBooking();
  const [activeTab, setActiveTab] = useState<HistoryTab>("online");

  useFocusEffect(
    useCallback(() => {
      void refreshOrders();
    }, [refreshOrders]),
  );

  const onlineOrders = useMemo(() => orders.filter((o) => o.kind === "free_online"), [orders]);
  const ambulatoryOrders = useMemo(() => orders.filter((o) => o.kind === "formal"), [orders]);
  const visibleOrders = activeTab === "online" ? onlineOrders : ambulatoryOrders;

  return (
    <ScreenScrollView
      className="flex-1 bg-app-bg"
      contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
    >
      <Tabs.Screen options={{ tabBarLabel: "Цаг захиалга", headerTitle: "" }} />
      <SectionHeader title="Цаг захиалгын түүх" subtitle="Өмнөх болон идэвхтэй үзлэгүүдээ эндээс харна." />

      <Card className="mb-4">
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => setActiveTab("online")}
            className={`min-h-[48px] flex-1 items-center justify-center rounded-xl border px-2 py-2.5 ${
              activeTab === "online"
                ? "border-brand-600 bg-brand-50 dark:border-brand-400 dark:bg-brand-900"
                : "border-slate-200 bg-white border-app-border bg-app-card"
            }`}
          >
            <Text
              className={`text-center text-sm font-medium ${
                activeTab === "online" ? "text-brand-700 dark:text-brand-300" : "text-app-text-secondary"
              }`}
              numberOfLines={2}
            >
              Онлайн үзлэг
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab("ambulatory")}
            className={`min-h-[48px] flex-1 items-center justify-center rounded-xl border px-2 py-2.5 ${
              activeTab === "ambulatory"
                ? "border-brand-600 bg-brand-50 dark:border-brand-400 dark:bg-brand-900"
                : "border-slate-200 bg-white border-app-border bg-app-card"
            }`}
          >
            <Text
              className={`text-center text-sm font-medium ${
                activeTab === "ambulatory" ? "text-brand-700 dark:text-brand-300" : "text-app-text-secondary"
              }`}
              numberOfLines={2}
            >
              Амбулаторын үзлэг
            </Text>
          </Pressable>
        </View>
      </Card>

      {ordersError ? (
        <ErrorState
          className="mb-4"
          title="Түүх ачаалагдаагүй"
          message={ordersError}
          onRetry={() => void refreshOrders()}
          retryLabel="Дахин оролдох"
        />
      ) : null}

      {ordersLoading && orders.length === 0 && !ordersError ? (
        <Card className="mb-4">
          <LoadingState compact title="Захиалгын түүх ачааллаж байна…" />
        </Card>
      ) : null}

      {!ordersLoading && !ordersError && visibleOrders.length === 0 ? (
        <Card className="mb-4 overflow-hidden">
          <EmptyState
            icon={activeTab === "online" ? "video-outline" : "calendar-clock-outline"}
            title={activeTab === "online" ? "Онлайн үзлэгийн түүх алга" : "Амбулаторын үзлэгийн түүх алга"}
            description="Таны захиалгууд энд харагдана. Эмнэлэг сонгож цаг товлоход энд бүртгэл үүснэ."
            action={{ label: "Эмнэлгүүд", onPress: () => router.push("/(customer)/clinics"), variant: "outline" }}
          />
        </Card>
      ) : null}

      {!ordersError && visibleOrders.length > 0 ? (
        <View className="mb-4 gap-3">
          {visibleOrders.map((o) => (
            <Card key={o.id}>
              <View className="flex-row items-start justify-between gap-2">
                <View className="min-w-0 flex-1 pr-1">
                  <Text className="text-sm font-semibold text-app-text" numberOfLines={3}>
                    {o.serviceTitle}
                  </Text>
                  <Text className="mt-1 text-xs text-app-text-muted" numberOfLines={2}>
                    {o.clinicName} · {o.doctorName}
                  </Text>
                  {o.slotLabel ? (
                    <Text className="mt-1 text-xs text-app-text-muted" numberOfLines={2}>
                      {o.slotLabel}
                    </Text>
                  ) : null}
                </View>
                <View className="shrink-0 self-start pt-0.5">
                  <Badge label={orderStatusLabel[o.customerStatus]} tone={statusTone(o.customerStatus)} />
                </View>
              </View>
            </Card>
          ))}
        </View>
      ) : null}

      <Link href="/(customer)/my-orders" asChild>
        <Button label="Бүх захиалга харах" variant="outline" />
      </Link>
    </ScreenScrollView>
  );
}
