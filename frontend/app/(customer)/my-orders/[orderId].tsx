import { Badge, Button, Card, ScreenScrollView, SectionHeader } from "@/components";
import { orderStatusLabel, type OrderUiStatus } from "@/constants/orderStatus";
import { useCustomerBooking } from "@/contexts/CustomerBookingContext";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { ApiError } from "@/lib/api/client";
import { bookingApi } from "@/services/api/bookingApi";
import { doctorReviewApi } from "@/services/api/doctorReviewApi";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Linking, Text, View } from "react-native";

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
  const [reviewBookingId, setReviewBookingId] = useState<number | null>(null);
  const [reviewHint, setReviewHint] = useState<string | null>(null);
  const order = useMemo(() => orders.find((o) => o.id === orderId), [orders, orderId]);

  useEffect(() => {
    if (!order || order.customerStatus !== "completed" || order.kind !== "formal") {
      setReviewBookingId(null);
      setReviewHint(null);
      return;
    }
    let alive = true;
    void doctorReviewApi.list(order.doctorId, { page_size: 1 }).then((res) => {
      if (!alive) return;
      if (res.viewer.can_submit && res.viewer.booking_id) {
        setReviewBookingId(res.viewer.booking_id);
        setReviewHint(null);
      } else {
        setReviewBookingId(null);
        setReviewHint(res.viewer.message);
      }
    }).catch(() => {
      if (alive) {
        setReviewBookingId(null);
        setReviewHint("Зөвхөн үзлэгт хамрагдсан хэрэглэгч үнэлгээ өгөх боломжтой.");
      }
    });
    return () => {
      alive = false;
    };
  }, [order?.id, order?.doctorId, order?.customerStatus, order?.kind]);
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
        className="flex-1 bg-app-bg"
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
      >
        {!order ? (
          <Card>
            <Text className="text-center text-sm text-app-text-secondary">Захиалга олдсонгүй.</Text>
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
                <Text className="text-xs text-app-text-secondary">
                  Офлайн горим: захиалгын мэдээлэл харах боломжтой, өөрчлөлт онлайн үед идэвхжинэ.
                </Text>
              </Card>
            ) : null}
            <Card className="mb-4">
              <Text className="text-xs font-medium uppercase tracking-wide text-app-text-muted">
                Эмнэлэг
              </Text>
              <Text className="mt-1 text-base text-app-text">{order.clinicName}</Text>
              <Text className="mt-4 text-xs font-medium uppercase tracking-wide text-app-text-muted">
                Эмч
              </Text>
              <Text className="mt-1 text-base text-app-text">{order.doctorName}</Text>
              {order.slotLabel ? (
                <>
                  <Text className="mt-4 text-xs font-medium uppercase tracking-wide text-app-text-muted">
                    Цаг
                  </Text>
                  <Text className="mt-1 text-base text-app-text">{order.slotLabel}</Text>
                </>
              ) : null}
              <Text className="mt-4 text-xs font-medium uppercase tracking-wide text-app-text-muted">
                Төлбөр
              </Text>
              <Text className="mt-1 text-base text-app-text">
                {order.kind === "free_online" ? "Төлбөргүй" : `${order.priceMnt.toString()} ₮`}
              </Text>
              <Text className="mt-4 text-xs font-medium uppercase tracking-wide text-app-text-muted">
                Огноо
              </Text>
              <Text className="mt-1 text-sm text-app-text-secondary">
                {new Date(order.createdAtIso).toLocaleString("mn-MN")}
              </Text>
            </Card>

            {order.kind === "free_online" && (order.symptoms || order.question || order.consultNotes) ? (
              <Card className="mb-4">
                <Text className="text-sm font-semibold text-app-text">Хүсэлтийн мэдээлэл</Text>
                {order.symptoms ? (
                  <>
                    <Text className="mt-3 text-xs font-medium text-app-text-muted">Биеийн байдал</Text>
                    <Text className="mt-1 text-sm leading-6 text-app-text-secondary">{order.symptoms}</Text>
                  </>
                ) : null}
                {order.question ? (
                  <>
                    <Text className="mt-3 text-xs font-medium text-app-text-muted">Асуух зүйл</Text>
                    <Text className="mt-1 text-sm leading-6 text-app-text-secondary">{order.question}</Text>
                  </>
                ) : null}
                {order.consultNotes ? (
                  <>
                    <Text className="mt-3 text-xs font-medium text-app-text-muted">Нэмэлт тайлбар</Text>
                    <Text className="mt-1 text-sm leading-6 text-app-text-secondary">{order.consultNotes}</Text>
                  </>
                ) : null}
              </Card>
            ) : order.healthSummary ? (
              <Card className="mb-4">
                <Text className="text-sm font-semibold text-app-text">Анкетын товч</Text>
                <Text className="mt-2 text-sm leading-6 text-app-text-secondary">{order.healthSummary}</Text>
              </Card>
            ) : null}

            {order.kind === "free_online" && order.customerStatus === "confirmed" ? (
              <Card className="mb-4 border border-emerald-200 dark:border-emerald-900/50">
                <Text className="text-sm font-semibold text-app-text">Онлайн уулзалт</Text>
                {order.meetingLink ? (
                  <>
                    <Text className="mt-2 text-xs leading-5 text-app-text-muted">
                      Эмч зөвшөөрсний дараа уулзалтын холбоос харагдана.
                    </Text>
                    <Button
                      label="Google Meet рүү орох"
                      className="mt-4"
                      onPress={() => void Linking.openURL(order.meetingLink!)}
                    />
                  </>
                ) : (
                  <Text className="mt-2 text-sm text-app-text-secondary">
                    Эмч зөвшөөрсний дараа уулзалтын холбоос харагдана.
                  </Text>
                )}
                {order.providerNotes ? (
                  <>
                    <Text className="mt-4 text-xs font-medium text-app-text-muted">Эмчийн нэмэлт тэмдэглэл</Text>
                    <Text className="mt-1 text-sm leading-6 text-app-text-secondary">{order.providerNotes}</Text>
                  </>
                ) : null}
              </Card>
            ) : null}

            {reviewBookingId != null ? (
              <Button
                label="Үнэлгээ өгөх"
                className="mb-3"
                onPress={() =>
                  router.push({
                    pathname: `/clinic/${order.clinicId}/doctor/${order.doctorId}` as never,
                    params: { reviewBookingId: String(reviewBookingId) },
                  })
                }
              />
            ) : reviewHint && order.customerStatus === "completed" && order.kind === "formal" ? (
              <Card className="mb-3 border-app-border bg-app-muted">
                <Text className="text-center text-xs text-app-text-secondary">{reviewHint}</Text>
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
            {rescheduleInfo ? <Text className="mt-2 text-xs text-app-text-secondary">{rescheduleInfo}</Text> : null}
          </>
        )}
      </ScreenScrollView>
    </>
  );
}
