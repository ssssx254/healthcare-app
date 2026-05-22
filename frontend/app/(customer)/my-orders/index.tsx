import { Badge, Button, Card, EmptyState, ErrorState, LoadingState, ScreenScrollView, SectionHeader } from "@/components";
import { orderStatusLabel, type OrderUiStatus } from "@/constants/orderStatus";
import { useCustomerBooking } from "@/contexts/CustomerBookingContext";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { router, Stack, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, RefreshControl, Text, View } from "react-native";

function statusTone(s: OrderUiStatus): "brand" | "neutral" | "success" | "warning" {
  if (s === "confirmed" || s === "completed" || s === "free_consult") return "success";
  if (s === "payment_required" || s === "pending") return "warning";
  if (s === "cancelled") return "neutral";
  return "brand";
}

type OrderTab = "upcoming" | "past" | "cancelled";

export default function MyOrdersScreen() {
  const { orders, ordersLoading, ordersError, refreshOrders } = useCustomerBooking();
  const { isOnline } = useNetworkStatus();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<OrderTab>("upcoming");

  useFocusEffect(
    useCallback(() => {
      void refreshOrders();
    }, [refreshOrders]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshOrders();
    } finally {
      setRefreshing(false);
    }
  }, [refreshOrders]);

  const tabbedOrders = useMemo(() => {
    const now = Date.now();
    const isPastByDate = (slotLabel?: string) => {
      if (!slotLabel) return false;
      const dateIso = slotLabel.split(" ")[0];
      if (!dateIso) return false;
      const parsed = new Date(dateIso).getTime();
      return Number.isFinite(parsed) && parsed < now;
    };
    return orders.filter((o) => {
      if (activeTab === "cancelled") return o.customerStatus === "cancelled";
      if (activeTab === "past") return o.customerStatus === "completed" || isPastByDate(o.slotLabel);
      return o.customerStatus !== "cancelled" && o.customerStatus !== "completed" && !isPastByDate(o.slotLabel);
    });
  }, [orders, activeTab]);

  return (
    <>
      <Stack.Screen options={{ title: "Миний захиалгууд" }} />
      <ScreenScrollView
        className="flex-1 bg-app-bg"
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <SectionHeader title="Миний захиалгууд" subtitle="Төлөв, үйлчилгээгээ энд хянаарай." />
        {!isOnline ? (
          <Card className="mb-3">
            <Text className="text-xs text-app-text-secondary">
              Офлайн горим: Захиалгаа харах боломжтой. Шинэ үйлдлүүд онлайн үед идэвхжинэ.
            </Text>
          </Card>
        ) : null}
        <View className="mb-3 flex-row gap-2">
          <TabButton label="Удахгүй болох" active={activeTab === "upcoming"} onPress={() => setActiveTab("upcoming")} />
          <TabButton label="Өнгөрсөн" active={activeTab === "past"} onPress={() => setActiveTab("past")} />
          <TabButton label="Цуцлагдсан" active={activeTab === "cancelled"} onPress={() => setActiveTab("cancelled")} />
        </View>
        {ordersError ? (
          <ErrorState
            className="mb-4"
            title="Захиалгууд ачаалагдаагүй"
            message={ordersError}
            onRetry={onRefresh}
            retryLabel="Дахин оролдох"
          />
        ) : null}

        {ordersLoading && orders.length === 0 && !ordersError ? (
          <Card className="mb-4">
            <LoadingState compact title="Захиалгуудыг ачааллаж байна…" subtitle="Түр хүлээнэ үү." />
          </Card>
        ) : null}

        {!ordersError && !ordersLoading && tabbedOrders.length === 0 ? (
          <Card className="overflow-hidden">
            <EmptyState
              icon="clipboard-list-outline"
              title={activeTab === "upcoming" ? "Удахгүй болох захиалга алга" : activeTab === "past" ? "Өнгөрсөн захиалга алга" : "Цуцлагдсан захиалга алга"}
              description={
                activeTab === "upcoming"
                  ? "Шинэ захиалга хийсний дараа энэ хэсэгт харагдана."
                  : activeTab === "past"
                    ? "Дууссан эсвэл өнгөрсөн захиалгууд энд харагдана."
                    : "Цуцалсан захиалгууд энд хадгалагдана."
              }
              action={{ label: "Эмнэлэг сонгох", onPress: () => router.push("/(customer)/clinics"), variant: "primary" }}
            />
          </Card>
        ) : null}

        {!ordersError && tabbedOrders.length > 0 ? (
          <View className="gap-3">
            {tabbedOrders.map((o) => (
              <Card key={o.id}>
                <Pressable onPress={() => router.push(`/my-orders/${o.id}`)}>
                  <View className="flex-row items-start justify-between gap-2">
                    <View className="min-w-0 flex-1">
                      <Text className="text-base font-semibold text-app-text" numberOfLines={2}>
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
                    <Badge label={orderStatusLabel[o.customerStatus]} tone={statusTone(o.customerStatus)} />
                  </View>
                  <Text className="mt-2 text-xs text-app-text-muted">
                    {new Date(o.createdAtIso).toLocaleString("mn-MN")}
                  </Text>
                </Pressable>
                {o.kind === "formal" && (o.customerStatus === "pending" || o.customerStatus === "payment_required") ? (
                  <Button
                    label="Төлбөр төлөх"
                    className="mt-3"
                    disabled={!isOnline}
                    onPress={() => router.push({ pathname: "/booking/payment-method", params: { orderId: o.id } })}
                  />
                ) : null}
              </Card>
            ))}
          </View>
        ) : null}
      </ScreenScrollView>
    </>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 rounded-xl border px-3 py-2 ${active ? "border-brand-600 bg-brand-50 dark:border-brand-400 dark:bg-brand-900/50" : "border-app-border bg-app-muted"}`}
    >
      <Text className={`text-center text-xs font-semibold ${active ? "text-brand-700 dark:text-brand-300" : "text-app-text-secondary"}`}>
        {label}
      </Text>
    </Pressable>
  );
}
