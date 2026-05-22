import { AuthMessageBanner, Button, Card, FormScrollView, QpayQrCode, SectionHeader } from "@/components";
import { getPaymentStatusLabel } from "@/constants/paymentStatus";
import { useCustomerBooking } from "@/contexts/CustomerBookingContext";
import { formatMnt } from "@/lib/formatMnt";
import { ApiError } from "@/lib/api/client";
import { walletApi, type QpayInvoiceResponse } from "@/services/api/walletApi";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

export default function QpayBookingPaymentScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { orders, completePayment } = useCustomerBooking();
  const order = useMemo(() => orders.find((o) => o.id === orderId), [orders, orderId]);
  const [invoice, setInvoice] = useState<QpayInvoiceResponse | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createInvoice = useCallback(async () => {
    if (!order) return;
    setError(null);
    setCreating(true);
    try {
      const inv = await walletApi.qpayBookingInvoice({ booking_id: Number(order.id) });
      setInvoice(inv);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Нэхэмжлэл үүсгэхэд алдаа гарлаа.");
    } finally {
      setCreating(false);
    }
  }, [order]);

  const confirmPaid = useCallback(async () => {
    if (!invoice || !order) return;
    setError(null);
    setConfirming(true);
    try {
      await walletApi.qpayBookingConfirm({ invoice_id: invoice.invoice_id });
      await completePayment(order.id, { booking_id: Number(order.id), channel: "qpay", qpay_invoice_id: invoice.invoice_id });
      router.replace({ pathname: "/booking/success", params: { orderId: order.id } });
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Баталгаажуулахад алдаа гарлаа.";
      router.replace({
        pathname: "/booking/payment-result",
        params: { kind: "booking", status: "failed", message: msg, orderId: order.id, channel: "qpay" },
      });
    } finally {
      setConfirming(false);
    }
  }, [invoice, order, completePayment]);

  return (
    <>
      <Stack.Screen options={{ title: "КьюПэй төлбөр" }} />
      <FormScrollView className="flex-1 px-5 pt-5 bg-app-bg" contentContainerStyle={{ paddingBottom: 40 }}>
        <SectionHeader
          title="КьюПэй (жишээ)"
          subtitle="Захиалгын төлбөр — QR уншуулж, дараа нь баталгаажуулна."
        />

        {error ? <AuthMessageBanner variant="error" message={error} className="mb-4" /> : null}

        {!order ? (
          <Card>
            <Text className="text-sm text-app-text-secondary">Захиалга олдсонгүй.</Text>
          </Card>
        ) : (
          <Card className="mb-4">
            <Text className="text-xs text-app-text-muted">Төлөх дүн</Text>
            <Text className="mt-1 text-2xl font-bold text-app-text">{formatMnt(order.priceMnt)}</Text>
            <Text className="mt-2 text-sm text-app-text-secondary" numberOfLines={2}>
              {order.serviceTitle}
            </Text>
          </Card>
        )}

        {!invoice ? (
          <Card>
            <Text className="text-sm text-app-text-secondary">
              Төлөв: {getPaymentStatusLabel("pending")}
            </Text>
            <Button
              label="QPay нэхэмжлэл үүсгэх"
              loading={creating}
              disabled={!order}
              onPress={createInvoice}
              className="mt-4 shadow-sm"
            />
          </Card>
        ) : (
          <Card className="mb-4 border-2 border-violet-200 dark:border-violet-900/50">
            <View className="mb-4 flex-row items-center gap-2">
              <MaterialCommunityIcons name="qrcode" size={22} color="#7c3aed" />
              <Text className="text-base font-bold text-app-text">Нэхэмжлэл бэлэн</Text>
            </View>
            <Text className="text-xs text-app-text-muted">Дүн</Text>
            <Text className="mt-1 text-2xl font-bold text-app-text">{formatMnt(invoice.amount_mnt)}</Text>
            <QpayQrCode value={invoice.qr_payload} className="mt-4" />
            <Text className="mt-3 text-xs leading-5 text-app-text-muted">{invoice.polling_hint_mn}</Text>
            {confirming ? <ActivityIndicator className="mt-4" /> : null}
            <Button label="Төлбөр төлөгдсөн гэж батлах" loading={confirming} onPress={confirmPaid} className="mt-5 shadow-md" />
          </Card>
        )}

        <Button label="Буцах" variant="ghost" className="mt-6" onPress={() => router.back()} />
      </FormScrollView>
    </>
  );
}
