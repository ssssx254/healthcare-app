import { AuthMessageBanner, Button, Card, FormScrollView, Input, SectionHeader } from "@/components";
import { formatMnt } from "@/lib/formatMnt";
import { ApiError } from "@/lib/api/client";
import {
  formatCardMask,
  paymentMethodsApi,
  type PaymentMethodRow,
} from "@/services/api/paymentMethodsApi";
import { walletApi } from "@/services/api/walletApi";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

type TopUpChannel = "instant" | "qpay" | "saved_card";

export default function WalletTopupScreen() {
  const { orderId, method, need, balance, source, flow } = useLocalSearchParams<{
    orderId?: string;
    method?: string;
    need?: string;
    balance?: string;
    source?: string;
    flow?: string;
  }>();
  const required = Number(need ?? 0);
  const [currentBalance, setCurrentBalance] = useState<number | null>(balance ? Number(balance) : null);
  const [amount, setAmount] = useState(String(Math.max(required, 20000) || 20000));
  const [loadingBalance, setLoadingBalance] = useState(!balance);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [channel, setChannel] = useState<TopUpChannel>(flow === "qpay" ? "qpay" : "instant");
  const [cards, setCards] = useState<PaymentMethodRow[]>([]);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);

  const loadBalance = useCallback(async () => {
    setLoadingBalance(true);
    setError(null);
    try {
      const b = await walletApi.balance();
      setCurrentBalance(b.balance);
    } catch {
      if (balance) setCurrentBalance(Number(balance));
      else setCurrentBalance(0);
    } finally {
      setLoadingBalance(false);
    }
  }, [balance]);

  const loadCards = useCallback(async () => {
    setCardsLoading(true);
    try {
      const rows = await paymentMethodsApi.list();
      setCards(rows);
      const def = rows.find((r) => r.is_default === 1 || r.is_default === true);
      setSelectedCardId(def?.id ?? rows[0]?.id ?? null);
    } catch {
      setCards([]);
    } finally {
      setCardsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBalance();
    void loadCards();
  }, [loadBalance, loadCards]);

  const presets = [10000, 20000, 50000, 100000, 200000];
  const amtNum = Number(amount.replace(/\D/g, "")) || 0;
  const nextBalance = useMemo(() => (currentBalance ?? 0) + amtNum, [currentBalance, amtNum]);

  const goAfterTopUp = () => {
    if (orderId && method) {
      router.replace({ pathname: "/booking/account-info", params: { orderId, method } });
      return;
    }
    router.replace("/(customer)/wallet");
  };

  const onTopUp = async () => {
    if (amtNum < 1) {
      setError("Цэнэглэх дүн оруулна уу.");
      return;
    }
    if (channel === "qpay") {
      router.push({
        pathname: "/booking/qpay-wallet",
        params: { amount: String(amtNum), orderId: orderId ?? "", method: method ?? "", source: source ?? "topup" },
      });
      return;
    }
    if (channel === "saved_card" && !selectedCardId) {
      setError("Хадгалсан карт сонгоно уу.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await walletApi.topUp({
        amount: amtNum,
        mock_gateway: channel === "saved_card" ? "saved_card" : "instant",
        payment_method_id: channel === "saved_card" ? selectedCardId : null,
        note: orderId ? `Захиалга ${orderId}` : "Цэнэглэлт (жишээ)",
      });
      router.replace({
        pathname: "/booking/payment-result",
        params: {
          kind: "topup",
          status: "success",
          amount: String(amtNum),
          orderId: orderId ?? "",
          method: method ?? "",
          channel,
        },
      });
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Цэнэглэхэд алдаа гарлаа.";
      router.replace({
        pathname: "/booking/payment-result",
        params: { kind: "topup", status: "failed", message: msg },
      });
    } finally {
      setSubmitting(false);
    }
  };

  const channels: Array<{ id: TopUpChannel; label: string; icon: "flash" | "qrcode" | "credit-card-outline" }> = [
    { id: "instant", label: "Шуурхай (жишээ)", icon: "flash" },
    { id: "qpay", label: "КьюПэй", icon: "qrcode" },
    { id: "saved_card", label: "Хадгалсан карт", icon: "credit-card-outline" },
  ];

  return (
    <>
      <Stack.Screen options={{ title: "Данс цэнэглэх" }} />
      <FormScrollView className="flex-1 px-5 pt-5 bg-app-bg" contentContainerStyle={{ paddingBottom: 40 }}>
        <SectionHeader
          title="Данс цэнэглэх"
          subtitle="Дүн сонгоод КьюПэй эсвэл хадгалсан картаар цэнэглэнэ (жишээ)."
        />

        {error ? <AuthMessageBanner variant="error" message={error} className="mb-4" /> : null}

        <Card className="mb-4 border border-app-border">
          <Text className="text-xs font-bold uppercase tracking-wide text-app-text-muted">Одоогийн үлдэгдэл</Text>
          {loadingBalance ? (
            <ActivityIndicator className="mt-3" />
          ) : (
            <Text className="mt-2 text-3xl font-bold text-app-text">{formatMnt(currentBalance ?? 0)}</Text>
          )}
          {required > 0 ? (
            <>
              <View className="my-4 h-px bg-app-border" />
              <Text className="text-xs font-semibold text-amber-800 dark:text-amber-200">Нэмж цэнэглэх шаардлагатай</Text>
              <Text className="mt-1 text-lg font-bold text-amber-700 dark:text-amber-300">{formatMnt(required)}</Text>
            </>
          ) : null}
        </Card>

        <Card className="mb-4">
          <Text className="mb-3 text-xs font-semibold uppercase tracking-wide text-app-text-muted">Төлбөрийн арга</Text>
          <View className="flex-row flex-wrap gap-2">
            {channels.map((c) => {
              const active = channel === c.id;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => setChannel(c.id)}
                  className={`flex-row items-center gap-2 rounded-2xl border px-3 py-2.5 ${
                    active ? "border-brand-600 bg-brand-50 dark:border-brand-400 dark:bg-brand-950/40" : "border-app-border"
                  }`}
                >
                  <MaterialCommunityIcons name={c.icon} size={18} color={active ? "#2563eb" : "#94a3b8"} />
                  <Text className={`text-sm font-semibold ${active ? "text-brand-700 dark:text-brand-300" : "text-app-text"}`}>
                    {c.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        {channel === "saved_card" ? (
          <Card className="mb-4">
            <Text className="text-xs font-bold uppercase tracking-wide text-app-text-muted">Карт</Text>
            {cardsLoading ? (
              <ActivityIndicator className="mt-3" />
            ) : cards.length === 0 ? (
              <View className="mt-3">
                <Text className="text-sm text-app-text-secondary">Хадгалсан карт байхгүй.</Text>
                <Button label="Карт нэмэх" className="mt-3" onPress={() => router.push("/(customer)/payment-methods/add-card")} />
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
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </Card>
        ) : null}

        {channel !== "qpay" ? (
          <Card className="mb-4">
            <Input
              appearance="prominent"
              label="Цэнэглэх дүн (₮)"
              value={amount}
              onChangeText={(t) => setAmount(t.replace(/[^\d]/g, ""))}
              keyboardType="number-pad"
              placeholder="20000"
              hint="Дүн тоогоор оруулна уу."
              className="min-h-[52px]"
            />
            <Text className="mb-3 text-xs font-semibold uppercase tracking-wide text-app-text-muted">Түргэн сонголт</Text>
            <View className="flex-row flex-wrap gap-2">
              {presets.map((p) => (
                <Pressable
                  key={p}
                  className="rounded-2xl border px-4 py-2.5 active:opacity-80 border-app-border-strong bg-app-muted"
                  onPress={() => setAmount(String(p))}
                >
                  <Text className="text-sm font-semibold text-app-text">{formatMnt(p)}</Text>
                </Pressable>
              ))}
            </View>
            <View className="mt-4 rounded-2xl px-4 py-3 bg-app-muted/80">
              <Text className="text-xs text-app-text-secondary">Цэнэглэсний дараа</Text>
              <Text className="mt-1 text-lg font-bold text-brand-700 dark:text-brand-300">{formatMnt(nextBalance)}</Text>
            </View>
          </Card>
        ) : null}

        <Button
          label={channel === "qpay" ? "КьюПэй рүү шилжих" : "Цэнэглэх (жишээ)"}
          loading={submitting}
          onPress={onTopUp}
          className="shadow-md"
        />
        <Text className="mt-2 text-center text-xs leading-5 text-app-text-muted">
          Жинхэнэ банкны холболт биш — зөвхөн жишээ төлбөр.
        </Text>

        <Button label="Буцах" variant="ghost" className="mt-8" onPress={() => (orderId ? goAfterTopUp() : router.back())} />
      </FormScrollView>
    </>
  );
}
