import { Badge, Button, Card, ScreenScrollView, SectionHeader } from "@/components";
import { orderStatusLabel, type OrderUiStatus } from "@/constants/orderStatus";
import { useCustomerBooking } from "@/contexts/CustomerBookingContext";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { ApiError } from "@/lib/api/client";
import { bookingApi } from "@/services/api/bookingApi";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Text, View } from "react-native";

function statusTone(s: OrderUiStatus): "brand" | "neutral" | "success" | "warning" {
  if (s === "confirmed" || s === "completed" || s === "free_consult") return "success";
  if (s === "payment_required" || s === "pending") return "warning";
  if (s === "cancelled") return "neutral";
  return "brand";
}

export default function OrderDetailScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { orders, cancelOrder } = useCustomerBooking();
  const { isOnline } = useNetworkStatus();
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [rescheduleInfo, setRescheduleInfo] = useState<string | null>(null);
  const order = useMemo(() => orders.find((o) => o.id === orderId), [orders, orderId]);
  const canCustomerCancel =
    order &&
    order.customerStatus !== "cancelled" &&
    (order.customerStatus === "pending" ||
      order.customerStatus === "payment_required" ||
      (order.kind === "free_online" &&
        (order.customerStatus === "free_consult" || order.customerStatus === "confirmed")));

  return (
    <>
      <Stack.Screen options={{ title: "Захиалгын дэлгэрэнгүй" }} />
      <ScreenScrollView
        className="flex-1 bg-slate-50 dark:bg-slate-950"
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
      >
        {!order ? (
          <Card>
            <Text className="text-center text-sm text-slate-600 dark:text-slate-300">Захиалга олдсонгүй.</Text>
            <Button label="Жагсаалт руу" className="mt-4" onPress={() => router.replace("/(customer)/my-orders")} />
          </Card>
        ) : (
          <>
            <SectionHeader
              title={order.serviceTitle}
              action={<Badge label={orderStatusLabel[order.customerStatus]} tone={statusTone(order.customerStatus)} />}
            />

            {actionError ? <Text className="mb-3 text-sm text-red-600 dark:text-red-400">{actionError}</Text> : null}
            {!isOnline ? (
              <Card className="mb-3">
                <Text className="text-xs text-slate-600 dark:text-slate-300">
                  Офлайн горим: захиалгын мэдээлэл харах боломжтой, өөрчлөлт онлайн үед идэвхжинэ.
                </Text>
              </Card>
            ) : null}
            <Card className="mb-4">
              <Text className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Эмнэлэг
              </Text>
              <Text className="mt-1 text-base text-slate-900 dark:text-slate-50">{order.clinicName}</Text>
              <Text className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Эмч
              </Text>
              <Text className="mt-1 text-base text-slate-900 dark:text-slate-50">{order.doctorName}</Text>
              {order.slotLabel ? (
                <>
                  <Text className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Цаг
                  </Text>
                  <Text className="mt-1 text-base text-slate-900 dark:text-slate-50">{order.slotLabel}</Text>
                </>
              ) : null}
              <Text className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Төлбөр
              </Text>
              <Text className="mt-1 text-base text-slate-900 dark:text-slate-50">
                {order.kind === "free_online" ? "Төлбөргүй" : `${order.priceMnt.toString()} ₮`}
              </Text>
              <Text className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Огноо
              </Text>
              <Text className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {new Date(order.createdAtIso).toLocaleString("mn-MN")}
              </Text>
            </Card>

            {order.healthSummary ? (
              <Card className="mb-4">
                <Text className="text-sm font-semibold text-slate-800 dark:text-slate-100">Анкетын товч</Text>
                <Text className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{order.healthSummary}</Text>
              </Card>
            ) : null}

            {order.kind === "formal" && (order.customerStatus === "pending" || order.customerStatus === "payment_required") ? (
              <Button
                label="Төлбөр төлөх"
                className="mb-3"
                disabled={!isOnline || actionLoading}
                onPress={() => router.push({ pathname: "/booking/payment-method", params: { orderId: order.id } })}
              />
            ) : null}

            {canCustomerCancel ? (
              <Button
                label="Цуцлах"
                variant="outline"
                loading={actionLoading}
                disabled={!isOnline}
                onPress={() => {
                  void (async () => {
                    try {
                      setActionError(null);
                      setActionLoading(true);
                      await cancelOrder(order.id);
                      router.back();
                    } catch (e) {
                      setActionError(e instanceof Error ? e.message : "Захиалга цуцлахад алдаа гарлаа.");
                    } finally {
                      setActionLoading(false);
                    }
                  })();
                }}
              />
            ) : null}
            {order.kind === "formal" && order.customerStatus !== "cancelled" ? (
              <Button
                label="Цаг өөрчлөх"
                variant="ghost"
                className="mt-2"
                disabled={!isOnline || actionLoading}
                onPress={() => {
                  void (async () => {
                    setActionError(null);
                    setRescheduleInfo(null);
                    // Safe flow: backend endpoint байвал оролдож, байхгүй бол UI TODO урсгал руу шилжинэ.
                    try {
                      setActionLoading(true);
                      if (!order.slotId) {
                        setRescheduleInfo("Шинэ цаг сонгох дэлгэц рүү шилжүүллээ.");
                        router.push("/(customer)/booking/select-day");
                        return;
                      }
                      await bookingApi.reschedule(order.id, { slot_id: Number(order.slotId) });
                      setRescheduleInfo("Цаг өөрчлөх хүсэлт илгээгдлээ.");
                    } catch (e) {
                      const message = e instanceof Error ? e.message : "";
                      const status = e instanceof ApiError ? e.status : -1;
                      if (status === 404 || /404|not found|reschedule/i.test(message.toLowerCase())) {
                        setRescheduleInfo("Цаг өөрчлөх API бэлэн болоогүй байна. Түр хугацаанд шинэ цаг сонгох дэлгэц рүү шилжүүллээ.");
                        router.push("/(customer)/booking/select-day");
                        return;
                      }
                      setActionError(message || "Цаг өөрчлөхөд алдаа гарлаа.");
                    } finally {
                      setActionLoading(false);
                    }
                  })();
                }}
              />
            ) : null}
            {rescheduleInfo ? <Text className="mt-2 text-xs text-slate-600 dark:text-slate-300">{rescheduleInfo}</Text> : null}
          </>
        )}
      </ScreenScrollView>
    </>
  );
}
