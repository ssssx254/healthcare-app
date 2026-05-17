import { Button, Card, FormScrollView, SectionHeader } from "@/components";
import { orderStatusLabel } from "@/constants/orderStatus";
import { useCustomerBooking } from "@/contexts/CustomerBookingContext";
import { ApiError } from "@/lib/api/client";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Text } from "react-native";
import { useEffect } from "react";

export default function PaymentScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { orders, completePayment } = useCustomerBooking();
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const order = useMemo(() => orders.find((o) => o.id === orderId), [orders, orderId]);

  const onPay = async () => {
    if (!order) return;
    if (order.customerStatus !== "pending" && order.customerStatus !== "payment_required") return;
    setFormError(null);
    setLoading(true);
    try {
      await completePayment(order.id);
      Alert.alert("Амжилттай", "Төлбөр бүртгэгдлээ.");
      router.replace("/(customer)/my-orders");
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Төлбөр бүртгэхэд алдаа гарлаа.";
      setFormError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      router.replace({ pathname: "/booking/payment-method", params: { orderId } });
    }
  }, [orderId]);

  return (
    <>
      <Stack.Screen options={{ title: "Төлбөр" }} />
      <FormScrollView
        className="flex-1 bg-slate-50 dark:bg-slate-950"
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
      >
        <SectionHeader title="Төлбөр" subtitle="Төлбөрийн модуль — одоогоор жишээ." />
        {formError ? (
          <Text className="mb-2 text-sm text-red-600 dark:text-red-400">{formError}</Text>
        ) : null}

        {!order ? (
          <Card>
            <Text className="text-center text-sm text-slate-600 dark:text-slate-300">Захиалга олдсонгүй.</Text>
            <Button label="Миний захиалгууд" className="mt-4" onPress={() => router.replace("/(customer)/my-orders")} />
          </Card>
        ) : order.customerStatus === "confirmed" ? (
          <Card>
            <Text className="text-sm text-slate-600 dark:text-slate-300">
              Энэ захиалга аль хэдийн баталгаажсан байна.
            </Text>
            <Button label="Миний захиалгууд" className="mt-4" onPress={() => router.replace("/(customer)/my-orders")} />
          </Card>
        ) : order.kind === "free_online" || order.priceMnt === 0 ? (
          <Card>
            <Text className="text-sm text-slate-600 dark:text-slate-300">
              Энэ захиалгад төлбөр шаардлагагүй.
            </Text>
            <Button label="Буцах" className="mt-4" onPress={() => router.replace("/(customer)/my-orders")} />
          </Card>
        ) : order.customerStatus === "cancelled" ? (
          <Card>
            <Text className="text-sm text-slate-600 dark:text-slate-300">Энэ захиалга цуцлагдсан байна.</Text>
            <Button label="Миний захиалгууд" className="mt-4" onPress={() => router.replace("/(customer)/my-orders")} />
          </Card>
        ) : (
          <Card>
            <Text className="text-sm text-slate-600 dark:text-slate-300">{order.serviceTitle}</Text>
            <Text className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-50">
              {order.priceMnt.toString()} ₮
            </Text>
            <Text className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              Төлөв: {orderStatusLabel[order.customerStatus]}
            </Text>
            <Button
              label="Төлбөр төлөх (жишээ)"
              loading={loading}
              className="mt-4"
              onPress={onPay}
            />
            <Text className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
              Бодит төлбөрийн систем холбогдохоор энд солигдоно.
            </Text>
          </Card>
        )}
      </FormScrollView>
    </>
  );
}
