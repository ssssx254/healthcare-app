import { Button, Card, FormScrollView, SectionHeader } from "@/components";
import { routes } from "@/constants/appRoutes";
import { orderEligibleForDoctorReview } from "@/lib/canSubmitDoctorReview";
import { formatMnt } from "@/lib/formatMnt";
import { useCustomerBooking } from "@/contexts/CustomerBookingContext";
import { doctorReviewApi } from "@/services/api/doctorReviewApi";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Link, router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

export default function BookingSuccessScreen() {
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const { orders } = useCustomerBooking();
  const order = orderId ? orders.find((o) => o.id === orderId) : null;
  const [reviewBookingId, setReviewBookingId] = useState<number | null>(null);

  useEffect(() => {
    if (!order || !orderEligibleForDoctorReview(order)) {
      setReviewBookingId(null);
      return;
    }
    let alive = true;
    void doctorReviewApi.list(order.doctorId, { page_size: 1 }).then((res) => {
      if (!alive) return;
      setReviewBookingId(res.viewer.can_submit && res.viewer.booking_id ? res.viewer.booking_id : null);
    }).catch(() => {
      if (alive) setReviewBookingId(null);
    });
    return () => {
      alive = false;
    };
  }, [order?.id, order?.doctorId, order?.customerStatus]);

  return (
    <>
      <Stack.Screen
        options={{
          title: "Амжилттай",
          gestureEnabled: false,
          headerBackVisible: false,
        }}
      />
      <FormScrollView className="flex-1 px-5 pt-6 bg-app-bg" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="mb-4 items-center">
          <View className="h-20 w-20 items-center justify-center rounded-3xl bg-emerald-100 dark:bg-emerald-900/40">
            <MaterialCommunityIcons name="calendar-check" size={44} color="#059669" />
          </View>
        </View>
        <SectionHeader
          variant="hero"
          title="Захиалга баталгаажлаа"
          subtitle="Төлбөр бүртгэгдэж, цаг тань системд хадгалагдлаа."
        />
        <Card className="border border-emerald-100 dark:border-emerald-900/40">
          {order ? (
            <>
              <Text className="text-sm font-semibold text-app-text">{order.serviceTitle}</Text>
              <Text className="mt-1 text-xs text-app-text-muted">
                {order.doctorName} · {order.clinicName}
              </Text>
              {order.priceMnt > 0 ? (
                <Text className="mt-3 text-lg font-bold text-app-text">{formatMnt(order.priceMnt)}</Text>
              ) : null}
            </>
          ) : (
            <Text className="text-sm leading-6 text-app-text-secondary">Таны захиалга амжилттай бүртгэгдлээ.</Text>
          )}
          <Text className="mt-4 text-xs leading-5 text-app-text-muted">
            Мэдэгдэл, «Миний захиалгууд»-аас төлөвөө дагаж байна уу.
          </Text>
          {reviewBookingId != null && order ? (
            <Button
              label="Үнэлгээ өгөх"
              className="mt-5 shadow-sm"
              onPress={() =>
                router.push({
                  pathname: `/clinic/${order.clinicId}/doctor/${order.doctorId}` as never,
                  params: { reviewBookingId: String(reviewBookingId) },
                })
              }
            />
          ) : null}
          <Link href={routes.customerMyOrders} asChild>
            <Button label="Миний захиалгууд" className={reviewBookingId ? "mt-3 shadow-sm" : "mt-5 shadow-sm"} />
          </Link>
          <Link href={routes.customerHome} asChild>
            <Button label="Нүүр рүү" variant="outline" className="mt-3" />
          </Link>
        </Card>
      </FormScrollView>
    </>
  );
}
