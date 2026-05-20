import { AuthMessageBanner, Button, Card, ScreenScrollView, SectionHeader } from "@/components";
import { routes } from "@/constants/appRoutes";
import { formatMnt } from "@/lib/formatMnt";
import { walletApi, type WalletTransactionRow } from "@/services/api/walletApi";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Link, router, Tabs, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, Text, View } from "react-native";

function txLabel(type: string): string {
  switch (type) {
    case "top_up":
      return "Цэнэглэлт";
    case "booking_payment":
      return "Захиалгын төлбөр";
    case "booking_refund":
      return "Буцаалт";
    case "admin_adjustment":
      return "Системийн засвар";
    default:
      return type;
  }
}

export default function CustomerWalletScreen() {
  const [balance, setBalance] = useState<number | null>(null);
  const [items, setItems] = useState<WalletTransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [b, page] = await Promise.all([
        walletApi.balance(),
        walletApi.transactionsPaged({ page: 1, page_size: 30 }),
      ]);
      setBalance(b.balance);
      setItems(page.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ачааллахад алдаа гарлаа.");
      setBalance(null);
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void load();
  }, [load]);

  return (
    <>
      <Tabs.Screen options={{ tabBarLabel: "Цахим данс", headerTitle: "" }} />
      <ScreenScrollView
        className="flex-1 bg-app-bg"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 36 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <SectionHeader
          variant="hero"
          title="Цахим данс"
          subtitle="Төлбөр, цэнэглэлт, гүйлгээний түүхийг нэг дороос."
        />

        {error ? <AuthMessageBanner variant="error" message={error} className="mb-4" /> : null}

        <Card className="mb-5 overflow-hidden border-0 bg-brand-600 p-0 shadow-lg dark:bg-brand-700">
          <View className="px-5 pb-6 pt-6">
            <Text className="text-xs font-bold uppercase tracking-widest text-white/80">Үлдэгдэл</Text>
            {loading && balance === null ? (
              <ActivityIndicator color="#fff" className="mt-4" />
            ) : (
              <Text className="mt-2 text-4xl font-bold tracking-tight text-white" numberOfLines={1}>
                {balance !== null ? formatMnt(balance) : "—"}
              </Text>
            )}
            <Text className="mt-3 text-sm leading-5 text-white/90">
              Захиалгын төлбөрийг эндээс төлж, шаардлагатай үед цэнэглэнэ үү.
            </Text>
          </View>
          <View className="flex-row gap-3 border-t border-white/15 bg-black/10 px-4 py-4">
            <Link href={{ pathname: "/booking/wallet-topup", params: { source: "wallet" } }} asChild>
              <Pressable className="min-h-[48px] flex-1 items-center justify-center rounded-2xl bg-white active:opacity-90">
                <Text className="text-center text-sm font-bold text-brand-700">Цэнэглэх</Text>
              </Pressable>
            </Link>
            <Link
              href={{ pathname: "/booking/wallet-topup", params: { source: "wallet", flow: "qpay" } }}
              asChild
            >
              <Pressable className="min-h-[48px] flex-1 items-center justify-center rounded-2xl border-2 border-white/90 active:bg-white/10">
                <Text className="text-center text-sm font-bold text-white">КьюПэй</Text>
              </Pressable>
            </Link>
          </View>
        </Card>

        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-base font-bold text-app-text">Гүйлгээний түүх</Text>
          <MaterialCommunityIcons name="history" size={22} color="#64748b" />
        </View>

        {loading && items.length === 0 ? (
          <Card>
            <View className="items-center py-10">
              <ActivityIndicator />
              <Text className="mt-3 text-sm text-app-text-muted">Ачааллаж байна…</Text>
            </View>
          </Card>
        ) : items.length === 0 ? (
          <Card>
            <Text className="text-center text-sm text-app-text-secondary">Гүйлгээ байхгүй байна.</Text>
            <Text className="mt-2 text-center text-xs leading-5 text-app-text-muted">
              Эхний цэнэглэлтээ хийснээр энд жагсаагдана.
            </Text>
          </Card>
        ) : (
          <View className="gap-2">
            {items.map((tx) => {
              const amt = Number(tx.amount);
              const isCredit = tx.direction === "credit";
              return (
                <Card key={tx.id} className="border py-3.5 border-app-border" padded={false}>
                  <View className="flex-row items-center justify-between px-4">
                    <View className="min-w-0 flex-1 pr-3">
                      <Text className="text-sm font-semibold text-app-text" numberOfLines={1}>
                        {txLabel(tx.transaction_type)}
                      </Text>
                      <Text className="mt-0.5 text-xs text-app-text-muted">
                        {new Date(tx.created_at).toLocaleString("mn-MN", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text
                        className={`text-base font-bold ${isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-app-text"}`}
                      >
                        {isCredit ? "+" : "−"}
                        {formatMnt(amt)}
                      </Text>
                      <Text className="mt-0.5 text-[11px] text-app-text-muted">
                        Дараа: {formatMnt(tx.balance_after)}
                      </Text>
                    </View>
                  </View>
                </Card>
              );
            })}
          </View>
        )}

        <Button label="Нүүр рүү" variant="ghost" className="mt-8" onPress={() => router.push(routes.customerHome)} />
      </ScreenScrollView>
    </>
  );
}
