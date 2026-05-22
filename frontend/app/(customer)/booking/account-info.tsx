import { AuthMessageBanner, Button, Card, FormScrollView, SectionHeader } from "@/components";
import { getPaymentStatusLabel } from "@/constants/paymentStatus";
import { useCustomerBooking } from "@/contexts/CustomerBookingContext";
import { useAuth } from "@/hooks/useAuth";
import { formatMnt } from "@/lib/formatMnt";
import { ApiError } from "@/lib/api/client";
import {
  formatCardMask,
  paymentMethodsApi,
  type PaymentMethodRow,
} from "@/services/api/paymentMethodsApi";
import { walletApi, type PaymentChannel } from "@/services/api/walletApi";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import type { ComponentProps } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

type Method = PaymentChannel | "bank_card";

const methodLabel: Record<Method, string> = {
  wallet: "Цахим данс",
  qpay: "КьюПэй",
  bank_card: "Банкны карт",
  saved_card: "Хадгалсан карт",
};

const methodIcon: Record<Method, ComponentProps<typeof MaterialCommunityIcons>["name"]> = {
  wallet: "wallet-outline",
  qpay: "qrcode",
  bank_card: "credit-card-plus-outline",
  saved_card: "credit-card-outline",
};

export default function AccountInfoScreen() {
  const { orderId, method: methodRaw } = useLocalSearchParams<{ orderId: string; method?: string }>();
  const method: Method = (["wallet", "qpay", "bank_card", "saved_card"] as const).includes(methodRaw as Method)
    ? (methodRaw as Method)
    : "wallet";
  const { orders, completePayment } = useCustomerBooking();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveWalletBalance, setLiveWalletBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [cards, setCards] = useState<PaymentMethodRow[]>([]);
  const [cardsLoading, setCardsLoading] = useState(method === "saved_card");
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);

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

  const loadCards = useCallback(async () => {
    if (method !== "saved_card") return;
    setCardsLoading(true);
    try {
      const rows = await paymentMethodsApi.list();
      setCards(rows);
      const def = rows.find((r) => r.is_default === 1 || r.is_default === true);
      setSelectedCardId(def?.id ?? rows[0]?.id ?? null);
    } catch {
      setCards([]);
      setSelectedCardId(null);
    } finally {
      setCardsLoading(false);
    }
  }, [method]);

  useEffect(() => {
    void refreshBalance();
    void loadCards();
  }, [refreshBalance, loadCards, method, orderId]);

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
        await completePayment(order.id, { booking_id: Number(order.id), channel: "wallet" });
      } else if (method === "saved_card") {
        if (!selectedCardId) {
          setError("Хадгалсан карт сонгоно уу.");
          setLoading(false);
          return;
        }
        await completePayment(order.id, {
          booking_id: Number(order.id),
          channel: "saved_card",
          payment_method_id: selectedCardId,
        });
      } else {
        setError("Энэ төлбөрийн аргыг энд баталгаажуулахгүй.");
        setLoading(false);
        return;
      }
      router.replace({ pathname: "/booking/success", params: { orderId: order.id } });
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Төлбөр хийхэд алдаа гарлаа.";
      router.replace({
        pathname: "/booking/payment-result",
        params: { kind: "booking", status: "failed", message: msg, orderId: order.id, method },
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
            <Card className="mb-4 overflow-hidden border-0 bg-slate-900 p-0">
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
                  <Text className="mt-2 text-xs text-app-text-muted">
                    Төлөв: {getPaymentStatusLabel("pending")}
                  </Text>
                </View>
              </View>
            </Card>

            {method === "saved_card" ? (
              <Card className="mb-4">
                <Text className="text-xs font-bold uppercase tracking-wide text-app-text-muted">Карт сонгох</Text>
                {cardsLoading ? (
                  <ActivityIndicator className="mt-4" />
                ) : cards.length === 0 ? (
                  <View className="mt-3">
                    <Text className="text-sm text-app-text-secondary">Хадгалсан карт байхгүй.</Text>
                    <Button
                      label="Карт нэмэх"
                      className="mt-3"
                      onPress={() =>
                        router.push({ pathname: "/(customer)/payment-methods/add-card", params: { returnTo: "booking", orderId } })
                      }
                    />
                  </View>
                ) : (
                  <View className="mt-3 gap-2">
                    {cards.map((c) => {
                      const active = selectedCardId === c.id;
                      return (
                        <Pressable key={c.id} onPress={() => setSelectedCardId(c.id)}>
                          <View
                            className={`rounded-2xl border px-4 py-3 ${
                              active ? "border-brand-600 bg-brand-50 dark:border-brand-400 dark:bg-brand-950/30" : "border-app-border"
                            }`}
                          >
                            <Text className="text-sm font-bold text-app-text">{formatCardMask(c)}</Text>
                            <Text className="mt-0.5 text-xs text-app-text-muted">{c.card_holder_name}</Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </Card>
            ) : null}

            {method === "wallet" ? (
              <Card className="mb-4">
                <Text className="text-xs font-bold uppercase tracking-wide text-app-text-muted">Цахим данс</Text>
                {balanceLoading ? (
                  <ActivityIndicator className="mt-3" />
                ) : (
                  <Text className="mt-2 text-2xl font-bold text-app-text">{formatMnt(walletBalance)}</Text>
                )}
                {order ? (
                  <Text className="mt-2 text-xs text-app-text-muted">
                    Захиалгын дараа: {formatMnt(Math.max(0, walletBalance - order.priceMnt))}
                  </Text>
                ) : null}

                {needTopUp && order ? (
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
              </Card>
            ) : null}

            {error ? <AuthMessageBanner variant="error" message={error} className="mb-4" /> : null}

            <Button
              label="Төлбөр төлөх"
              loading={loading}
              onPress={onPay}
              disabled={Boolean(needTopUp) || (method === "saved_card" && !selectedCardId)}
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
