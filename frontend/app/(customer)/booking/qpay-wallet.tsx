import { AuthMessageBanner, Button, Card, FormScrollView, Input, SectionHeader } from "@/components";
import { formatMnt } from "@/lib/formatMnt";
import { ApiError } from "@/lib/api/client";
import { walletApi, type QpayInvoiceResponse } from "@/services/api/walletApi";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";

export default function QpayWalletTopupScreen() {
  const { amount: amountParam, orderId, method, source } = useLocalSearchParams<{
    amount?: string;
    orderId?: string;
    method?: string;
    source?: string;
  }>();
  const [amount, setAmount] = useState(amountParam && Number(amountParam) > 0 ? String(amountParam) : "20000");
  const [invoice, setInvoice] = useState<QpayInvoiceResponse | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createInvoice = useCallback(async () => {
    const n = Number(amount.replace(/\D/g, ""));
    if (!n || n < 1) {
      setError("Зөв дүн оруулна уу.");
      return;
    }
    setError(null);
    setCreating(true);
    try {
      const inv = await walletApi.qpayCreateInvoice({ amount: n });
      setInvoice(inv);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Нэхэмжлэл үүсгэхэд алдаа гарлаа.");
    } finally {
      setCreating(false);
    }
  }, [amount]);

  const confirmPaid = useCallback(async () => {
    if (!invoice) return;
    setError(null);
    setConfirming(true);
    try {
      await walletApi.qpayConfirm({ invoice_id: invoice.invoice_id });
      router.replace({
        pathname: "/booking/payment-result",
        params: {
          kind: "topup",
          status: "success",
          amount: String(invoice.amount_mnt),
          channel: "qpay",
          orderId: orderId ?? "",
          method: method ?? "",
        },
      });
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Баталгаажуулахад алдаа гарлаа.";
      setError(msg);
    } finally {
      setConfirming(false);
    }
  }, [invoice]);

  const doneNavigate = () => {
    if (orderId && method) {
      router.replace({ pathname: "/booking/account-info", params: { orderId, method } });
    } else {
      router.replace("/(customer)/wallet");
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: "КьюПэй цэнэглэлт" }} />
      <FormScrollView className="flex-1 px-5 pt-5 bg-app-bg" contentContainerStyle={{ paddingBottom: 40 }}>
        <SectionHeader
          title="КьюПэй (жишээ)"
          subtitle="Жинхэнэ төлбөр биш: нэхэмжлэл үүсгээд, банкны апп-аар төлсөн гэж үзээд баталгаажуулна."
        />

        {error ? <AuthMessageBanner variant="error" message={error} className="mb-4" /> : null}

        {!invoice ? (
          <Card className="mb-4">
            <Input
              appearance="prominent"
              label="Дүн (₮)"
              value={amount}
              onChangeText={(t) => setAmount(t.replace(/[^\d]/g, ""))}
              keyboardType="number-pad"
              placeholder="20000"
              className="min-h-[52px]"
            />
            <Button label="Нэхэмжлэл үүсгэх" loading={creating} onPress={createInvoice} className="mt-2 shadow-sm" />
          </Card>
        ) : (
          <Card className="mb-4 border-2 border-violet-200 dark:border-violet-900/50">
            <View className="mb-4 flex-row items-center gap-2">
              <MaterialCommunityIcons name="check-decagram" size={22} color="#7c3aed" />
              <Text className="text-base font-bold text-app-text">Нэхэмжлэл бэлэн</Text>
            </View>
            <Text className="text-xs text-app-text-muted">Дүн</Text>
            <Text className="mt-1 text-2xl font-bold text-app-text">{formatMnt(invoice.amount_mnt)}</Text>
            <Text className="mt-4 text-xs text-app-text-muted">Дуусах хугацаа</Text>
            <Text className="mt-1 text-sm text-app-text">
              {new Date(invoice.expires_at).toLocaleString("mn-MN", { dateStyle: "medium", timeStyle: "short" })}
            </Text>
            <Text className="mt-4 text-xs font-semibold text-app-text-secondary">QR болон өгөгдөл (жишээ)</Text>
            <ScrollView horizontal className="mt-2 max-h-28 rounded-xl bg-slate-900 p-3" showsHorizontalScrollIndicator>
              <Text className="font-mono text-xs text-emerald-300" selectable>
                {invoice.qr_payload}
              </Text>
            </ScrollView>
            <Text className="mt-3 text-xs leading-5 text-app-text-muted">{invoice.polling_hint_mn}</Text>
            <Button label="Төлбөр төлөгдсөн гэж батлах" loading={confirming} onPress={confirmPaid} className="mt-5 shadow-md" />
            <Button
              label="Буцах"
              variant="ghost"
              className="mt-2"
              onPress={() => {
                setInvoice(null);
                setError(null);
              }}
            />
          </Card>
        )}

        {source === "wallet" && !orderId ? (
          <Button label="Хэтэвч руу" variant="outline" onPress={doneNavigate} />
        ) : null}
      </FormScrollView>
    </>
  );
}
