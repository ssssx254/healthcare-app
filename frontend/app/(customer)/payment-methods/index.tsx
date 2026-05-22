import { AuthMessageBanner, Button, Card, ScreenScrollView, SectionHeader } from "@/components";
import { ApiError } from "@/lib/api/client";
import {
  formatCardMask,
  paymentMethodsApi,
  type PaymentMethodRow,
} from "@/services/api/paymentMethodsApi";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, Stack, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Pressable, RefreshControl, Text, View } from "react-native";

export default function PaymentMethodsScreen() {
  const [items, setItems] = useState<PaymentMethodRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const rows = await paymentMethodsApi.list();
      setItems(rows);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Ачааллахад алдаа гарлаа.");
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

  const onSetDefault = async (id: number) => {
    setBusyId(id);
    try {
      await paymentMethodsApi.setDefault(id);
      await load();
    } catch (e) {
      Alert.alert("Алдаа", e instanceof ApiError ? e.message : "Үндсэн карт тохируулахад алдаа гарлаа.");
    } finally {
      setBusyId(null);
    }
  };

  const onDelete = (row: PaymentMethodRow) => {
    Alert.alert("Карт устгах", `${formatCardMask(row)} устгах уу?`, [
      { text: "Үгүй", style: "cancel" },
      {
        text: "Устгах",
        style: "destructive",
        onPress: async () => {
          setBusyId(row.id);
          try {
            await paymentMethodsApi.remove(row.id);
            await load();
          } catch (e) {
            Alert.alert("Алдаа", e instanceof ApiError ? e.message : "Устгахад алдаа гарлаа.");
          } finally {
            setBusyId(null);
          }
        },
      },
    ]);
  };

  return (
    <>
      <Stack.Screen options={{ title: "Төлбөрийн арга" }} />
      <ScreenScrollView
        className="flex-1 bg-app-bg"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 36 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}
      >
        <SectionHeader
          title="Төлбөрийн арга"
          subtitle="КьюПэй, банкны карт, хадгалсан карт. Бүтэн дугаар болон CVV хадгалахгүй."
        />

        {error ? <AuthMessageBanner variant="error" message={error} className="mb-4" /> : null}

        <Card className="mb-4 border border-violet-200 dark:border-violet-900/50">
          <View className="flex-row items-center gap-3">
            <View className="h-12 w-12 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/40">
              <MaterialCommunityIcons name="qrcode" size={26} color="#7c3aed" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-app-text">КьюПэй</Text>
              <Text className="mt-0.5 text-xs text-app-text-muted">QR төлбөр (жишээ урсгал)</Text>
            </View>
          </View>
        </Card>

        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-sm font-bold text-app-text">Хадгалсан карт</Text>
          <Pressable
            onPress={() => router.push("/(customer)/payment-methods/add-card")}
            className="flex-row items-center gap-1 rounded-xl px-3 py-2 active:opacity-80 bg-brand-600"
          >
            <MaterialCommunityIcons name="plus" size={18} color="#fff" />
            <Text className="text-xs font-bold text-white">Карт нэмэх</Text>
          </Pressable>
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
            <Text className="text-center text-sm text-app-text-secondary">Хадгалсан карт байхгүй.</Text>
            <Text className="mt-2 text-center text-xs leading-5 text-app-text-muted">
              Сүүлийн 4 орон, хугацаа, эзэмшигчийн нэрийг л хадгална.
            </Text>
            <Button label="Банкны карт нэмэх" className="mt-4" onPress={() => router.push("/(customer)/payment-methods/add-card")} />
          </Card>
        ) : (
          <View className="gap-2">
            {items.map((row) => {
              const isDefault = row.is_default === 1 || row.is_default === true;
              return (
                <Card key={row.id} className="border border-app-border">
                  <View className="flex-row items-start gap-3">
                    <View className="h-12 w-12 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/40">
                      <MaterialCommunityIcons name="credit-card-outline" size={24} color="#d97706" />
                    </View>
                    <View className="min-w-0 flex-1">
                      <Text className="text-base font-bold text-app-text">{formatCardMask(row)}</Text>
                      <Text className="mt-1 text-xs text-app-text-muted">{row.card_holder_name}</Text>
                      <Text className="mt-0.5 text-xs text-app-text-muted">
                        {String(row.expiry_month).padStart(2, "0")}/{row.expiry_year}
                      </Text>
                      {isDefault ? (
                        <Text className="mt-2 text-xs font-semibold text-brand-600 dark:text-brand-400">Үндсэн карт</Text>
                      ) : null}
                    </View>
                  </View>
                  <View className="mt-3 flex-row gap-2">
                    {!isDefault ? (
                      <Button
                        label="Үндсэн болгох"
                        variant="outline"
                        className="flex-1"
                        loading={busyId === row.id}
                        onPress={() => void onSetDefault(row.id)}
                      />
                    ) : null}
                    <Button
                      label="Устгах"
                      variant="ghost"
                      className="flex-1"
                      loading={busyId === row.id}
                      onPress={() => onDelete(row)}
                    />
                  </View>
                </Card>
              );
            })}
          </View>
        )}

        <Button label="Буцах" variant="ghost" className="mt-8" onPress={() => router.back()} />
      </ScreenScrollView>
    </>
  );
}
