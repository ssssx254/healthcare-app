import { AuthMessageBanner, Button, Card, FormScrollView, SectionHeader } from "@/components";
import { useCustomerBooking } from "@/contexts/CustomerBookingContext";
import { useAuth } from "@/hooks/useAuth";
import { formatMnt } from "@/lib/formatMnt";
import { ApiError } from "@/lib/api/client";
import { walletApi } from "@/services/api/walletApi";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import type { ComponentProps } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

type Method = "most_money" | "qpay" | "bank_card" | "wallet";

const methodLabel: Record<Method, string> = {
  most_money: "Мост мани",
  qpay: "КьюПэй",
  bank_card: "Банкны карт",
  wallet: "Цахим данс",
};

const methodIcon: Record<Method, ComponentProps<typeof MaterialCommunityIcons>["name"]> = {
  most_money: "cellphone-link",
  qpay: "qrcode",
  bank_card: "credit-card-outline",
  wallet: "wallet-outline",
};

export default function AccountInfoScreen() {
  const { orderId, method: methodRaw } = useLocalSearchParams<{ orderId: string; method?: string }>();
  const method: Method = (["most_money", "qpay", "bank_card", "wallet"] as const).includes(methodRaw as Method)
    ? (methodRaw as Method)
    : "wallet";
  const { orders, completePayment } = useCustomerBooking();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveWalletBalance, setLiveWalletBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);

  const order = useMemo(() => orders.find((o) => o.id === orderId), [orders, orderId]);

  const refreshBalance = useCallback(async () => {
    if (user?.role !== "customer") return;
    setBalanceLoading(true);
    try {
      const b = await walletApi.balance();
      setLiveWalletBalance(b.balance);
    } catch {
      setLiveWalletBalance(null);
    } finally {
      setBalanceLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    void refreshBalance();
  }, [refreshBalance, method, orderId]);

  const walletBalance = liveWalletBalance ?? 0;
  const needTopUp = method === "wallet" && order && walletBalance < order.priceMnt;
  const shortfall = order ? Math.max(0, order.priceMnt - walletBalance) : 0;

  const onPay = async () => {
    if (!order) return;
    setError(null);
    setLoading(true);
    try {
      if (method === "wallet") {
        const b = await walletApi.balance();
        if (b.balance < order.priceMnt) {
          setError("Үлдэгдэл хүрэлцэхгүй байна. Эхлээд «Данс цэнэглэх» дарна уу.");
          setLoading(false);
          return;
        }
      } else {
        const b = await walletApi.balance();
        const need = order.priceMnt - b.balance;
        if (need > 0) {
          await walletApi.topUp({
            amount: need,
            mock_gateway: method,
            note: `Захиалга ${order.id} — ${methodLabel[method]}`,
          });
        }
      }
      await completePayment(order.id);
      router.replace({ pathname: "/booking/success", params: { orderId: order.id } });
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Төлбөр хийхэд алдаа гарлаа.";
      router.replace({
        pathname: "/booking/payment-result",
        params: { kind: "booking", status: "failed", message: msg, orderId: order.id },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: "Төлбөрийг баталгаажуулах" }} />
      <FormScrollView className="flex-1 px-5 pt-5 bg-app-bg" contentContainerStyle={{ paddingBottom: 40 }}>
        <SectionHeader title="Төлбөр" subtitle="Дүн, аргаа шалгаад баталгаажуулна уу." />

        {!order ? (
          <Card>
            <Text className="text-sm text-app-text-secondary">Захиалга олдсонгүй.</Text>
            <Button label="Захиалгууд" className="mt-4" onPress={() => router.replace("/(customer)/my-orders")} />
          </Card>
        ) : (
          <>
            <Card className="mb-4 overflow-hidden border-0 bg-slate-900 p-0 bg-app-bg">
              <View className="px-5 pb-5 pt-5">
                <Text className="text-xs font-bold uppercase tracking-wider text-white/70">Төлөх дүн</Text>
                <Text className="mt-2 text-4xl font-bold text-white" numberOfLines={1}>
                  {formatMnt(order.priceMnt)}
                </Text>
                <Text className="mt-2 text-sm text-white/80" numberOfLines={2}>
                  {order.serviceTitle}
                </Text>
                <Text className="mt-1 text-xs text-white/60">
                  {order.clinicName} · {order.doctorName}
                </Text>
              </View>
            </Card>

            <Card className="mb-4">
              <View className="flex-row items-center gap-4">
                <View className="h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 dark:bg-brand-900/40">
                  <MaterialCommunityIcons name={methodIcon[method] ?? "wallet-outline"} size={28} color="#2563eb" />
                </View>
                <View className="min-w-0 flex-1">
                  <Text className="text-xs font-semibold uppercase tracking-wide text-app-text-muted">
                    Төлбөрийн арга
                  </Text>
                  <Text className="mt-1 text-lg font-bold text-app-text">{methodLabel[method]}</Text>
                  {method !== "wallet" ? (
                    <Text className="mt-2 text-xs leading-5 text-app-text-muted">
                      Жишээ орчин: сонгосон аргаар төлбөр төлөгдсөн гэж үзээд, дансаас суутгагдана.
                    </Text>
                  ) : null}
                </View>
              </View>
            </Card>

            <Card className="mb-4">
              <Text className="text-xs font-bold uppercase tracking-wide text-app-text-muted">
                Цахим данс
              </Text>
              {balanceLoading ? (
                <ActivityIndicator className="mt-3" />
              ) : (
                <Text className="mt-2 text-2xl font-bold text-app-text">{formatMnt(walletBalance)}</Text>
              )}
              {order && method === "wallet" ? (
                <Text className="mt-2 text-xs text-app-text-muted">
                  Захиалгын дараа: {formatMnt(Math.max(0, walletBalance - order.priceMnt))}
                </Text>
              ) : null}

              {method === "wallet" && needTopUp && order ? (
                <View className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
                  <Text className="text-sm font-semibold text-amber-900 dark:text-amber-100">Үлдэгдэл хүрэлцэхгүй</Text>
                  <Text className="mt-1 text-xs leading-5 text-amber-800 dark:text-amber-200">
                    Нэмж {formatMnt(shortfall)} цэнэглэх хэрэгтэй.
                  </Text>
                  <Button
                    label="Данс цэнэглэх"
                    className="mt-3"
                    onPress={() =>
                      router.push({
                        pathname: "/booking/wallet-topup",
                        params: {
                          orderId,
                          method,
                          need: String(shortfall),
                          balance: String(walletBalance),
                        },
                      })
                    }
                  />
                </View>
              ) : null}

              {method !== "wallet" && order ? (
                <View className="mt-4 rounded-2xl p-4 bg-app-muted/80">
                  <Text className="text-xs font-semibold text-app-text-secondary">Хүлээн авагч (жишээ)</Text>
                  <Text className="mt-1 text-sm font-medium text-app-text">«Эрүүл мэндийн туслах» ХХК</Text>
                  <Text className="mt-2 text-xs text-app-text-muted">Гүйлгээний утга: Захиалга № {order.id}</Text>
                </View>
              ) : null}
            </Card>

            {error ? <AuthMessageBanner variant="error" message={error} className="mb-4" /> : null}

            <Button
              label="Төлбөр төлөх"
              loading={loading}
              onPress={onPay}
              disabled={Boolean(needTopUp)}
              className="shadow-md"
            />
            {needTopUp ? (
              <Text className="mt-2 text-center text-xs text-amber-700 dark:text-amber-300">
                Эхлээд данс цэнэглэх эсвэл үлдэгдлээ нэмнэ үү.
              </Text>
            ) : null}
          </>
        )}
      </FormScrollView>
    </>
  );
}
