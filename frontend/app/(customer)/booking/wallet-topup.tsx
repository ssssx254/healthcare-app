import { AuthMessageBanner, Button, Card, FormScrollView, Input, SectionHeader } from "@/components";
import { formatMnt } from "@/lib/formatMnt";
import { ApiError } from "@/lib/api/client";
import { walletApi } from "@/services/api/walletApi";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

export default function WalletTopupScreen() {
  const { orderId, method, need, balance, source } = useLocalSearchParams<{
    orderId?: string;
    method?: string;
    need?: string;
    balance?: string;
    source?: string;
  }>();
  const required = Number(need ?? 0);
  const [currentBalance, setCurrentBalance] = useState<number | null>(balance ? Number(balance) : null);
  const [amount, setAmount] = useState(String(Math.max(required, 20000) || 20000));
  const [loadingBalance, setLoadingBalance] = useState(!balance);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    void loadBalance();
  }, [loadBalance]);

  const presets = [10000, 20000, 50000, 100000, 200000];
  const amtNum = Number(amount.replace(/\D/g, "")) || 0;
  const nextBalance = useMemo(() => (currentBalance ?? 0) + amtNum, [currentBalance, amtNum]);

  const goAfterTopUp = () => {
    if (orderId && method) {
      router.replace({
        pathname: "/booking/account-info",
        params: { orderId, method },
      });
      return;
    }
    router.replace("/(customer)/wallet");
  };

  const onInstantTopUp = async () => {
    if (amtNum < 1) {
      setError("Цэнэглэх дүн оруулна уу.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await walletApi.topUp({
        amount: amtNum,
        mock_gateway: "instant",
        note: orderId ? `Захиалга ${orderId}` : "Шуурхай цэнэглэлт (жишээ)",
      });
      router.replace({
        pathname: "/booking/payment-result",
        params: {
          kind: "topup",
          status: "success",
          amount: String(amtNum),
          orderId: orderId ?? "",
          method: method ?? "",
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

  return (
    <>
      <Stack.Screen options={{ title: "Данс цэнэглэх" }} />
      <FormScrollView className="flex-1 bg-slate-50 px-5 pt-5 dark:bg-slate-950" contentContainerStyle={{ paddingBottom: 40 }}>
        <SectionHeader
          title="Данс цэнэглэх"
          subtitle={
            orderId
              ? "Захиалгын төлбөр төлөхөд хангалттай үлдэгдэлтэй болгох."
              : "Шуурхай цэнэглэлт эсвэл КьюПэй-ээр (жишээ урсгал)."
          }
        />

        {error ? <AuthMessageBanner variant="error" message={error} className="mb-4" /> : null}

        <Card className="mb-4 border border-slate-200 dark:border-slate-700">
          <Text className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Одоогийн үлдэгдэл</Text>
          {loadingBalance ? (
            <ActivityIndicator className="mt-3" />
          ) : (
            <Text className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-50">
              {formatMnt(currentBalance ?? 0)}
            </Text>
          )}
          {required > 0 ? (
            <>
              <View className="my-4 h-px bg-slate-200 dark:bg-slate-700" />
              <Text className="text-xs font-semibold text-amber-800 dark:text-amber-200">Нэмж цэнэглэх шаардлагатай</Text>
              <Text className="mt-1 text-lg font-bold text-amber-700 dark:text-amber-300">{formatMnt(required)}</Text>
            </>
          ) : null}
        </Card>

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
          <Text className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Түргэн сонголт
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {presets.map((p) => (
              <Pressable
                key={p}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 active:opacity-80 dark:border-slate-600 dark:bg-slate-800"
                onPress={() => setAmount(String(p))}
              >
                <Text className="text-sm font-semibold text-slate-800 dark:text-slate-100">{formatMnt(p)}</Text>
              </Pressable>
            ))}
          </View>
          <View className="mt-4 rounded-2xl bg-slate-100 px-4 py-3 dark:bg-slate-800/80">
            <Text className="text-xs text-slate-600 dark:text-slate-300">Цэнэглэсний дараа</Text>
            <Text className="mt-1 text-lg font-bold text-brand-700 dark:text-brand-300">{formatMnt(nextBalance)}</Text>
          </View>
        </Card>

        <Button
          label="Шуурхай цэнэглэх (жишээ)"
          loading={submitting}
          onPress={onInstantTopUp}
          className="shadow-md"
        />
        <Text className="mt-2 text-center text-xs leading-5 text-slate-500 dark:text-slate-400">
          Жинхэнэ банкны холболт биш — үлдэгдэл шууд нэмэгдэнэ.
        </Text>

        <Pressable
          className="mt-6 flex-row items-center justify-between rounded-2xl border-2 border-slate-200 bg-white p-4 active:opacity-90 dark:border-slate-600 dark:bg-slate-900"
          onPress={() =>
            router.push({
              pathname: "/booking/qpay-wallet",
              params: {
                amount: String(amtNum || 20000),
                orderId: orderId ?? "",
                method: method ?? "",
                source: source ?? "topup",
              },
            })
          }
        >
          <View className="flex-row items-center gap-3">
            <View className="h-12 w-12 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/40">
              <MaterialCommunityIcons name="qrcode" size={26} color="#7c3aed" />
            </View>
            <View>
              <Text className="text-base font-bold text-slate-900 dark:text-slate-50">КьюПэй-ээр цэнэглэх</Text>
              <Text className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">QR · жишээ 2 алхамт урсгал</Text>
            </View>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#94a3b8" />
        </Pressable>

        <Button label="Буцах" variant="ghost" className="mt-8" onPress={() => (orderId ? goAfterTopUp() : router.back())} />
      </FormScrollView>
    </>
  );
}
