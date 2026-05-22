import { AuthMessageBanner, Button, Card, FormScrollView, Input, SectionHeader } from "@/components";
import { ApiError } from "@/lib/api/client";
import { paymentMethodsApi, type CardBrand } from "@/services/api/paymentMethodsApi";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

export default function AddPaymentCardScreen() {
  const { returnTo, orderId } = useLocalSearchParams<{ returnTo?: string; orderId?: string }>();
  const [holder, setHolder] = useState("");
  const [last4, setLast4] = useState("");
  const [expMonth, setExpMonth] = useState("");
  const [expYear, setExpYear] = useState("");
  const [brand, setBrand] = useState<CardBrand>("visa");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    const digits = last4.replace(/\D/g, "");
    if (digits.length !== 4) {
      setError("Картын сүүлийн 4 орон оруулна уу.");
      return;
    }
    const month = Number(expMonth);
    const year = Number(expYear);
    if (!holder.trim()) {
      setError("Карт эзэмшигчийн нэр оруулна уу.");
      return;
    }
    setSubmitting(true);
    try {
      await paymentMethodsApi.create({
        card_holder_name: holder.trim(),
        card_last4: digits,
        expiry_month: month,
        expiry_year: year,
        card_brand: brand,
        is_default: true,
      });
      if (returnTo === "booking" && orderId) {
        router.replace({ pathname: "/booking/account-info", params: { orderId, method: "saved_card" } });
      } else {
        router.replace("/(customer)/payment-methods");
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Карт хадгалахад алдаа гарлаа.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: "Карт нэмэх" }} />
      <FormScrollView className="flex-1 px-5 pt-5 bg-app-bg" contentContainerStyle={{ paddingBottom: 40 }}>
        <SectionHeader
          title="Банкны карт"
          subtitle="Бүтэн картын дугаар болон CVV хадгалахгүй. Зөвхөн аюулгүй метадата."
        />

        {error ? <AuthMessageBanner variant="error" message={error} className="mb-4" /> : null}

        <Card className="mb-4">
          <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-app-text-muted">Картын төрөл</Text>
          <View className="flex-row gap-2">
            {(["visa", "mastercard"] as const).map((b) => {
              const active = brand === b;
              return (
                <Pressable
                  key={b}
                  onPress={() => setBrand(b)}
                  className={`flex-1 flex-row items-center justify-center gap-2 rounded-2xl border-2 px-3 py-3 ${
                    active ? "border-brand-600 bg-brand-50 dark:border-brand-400 dark:bg-brand-950/40" : "border-app-border"
                  }`}
                >
                  <MaterialCommunityIcons
                    name="credit-card-outline"
                    size={20}
                    color={active ? "#2563eb" : "#94a3b8"}
                  />
                  <Text className={`text-sm font-bold ${active ? "text-brand-700 dark:text-brand-300" : "text-app-text"}`}>
                    {b === "visa" ? "Visa" : "Mastercard"}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Card className="mb-4 gap-3">
          <Input label="Карт эзэмшигчийн нэр" value={holder} onChangeText={setHolder} placeholder="БАТБОЛД" />
          <Input
            label="Сүүлийн 4 орон"
            value={last4}
            onChangeText={(t) => setLast4(t.replace(/\D/g, "").slice(0, 4))}
            keyboardType="number-pad"
            placeholder="1234"
            maxLength={4}
          />
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Input
                label="Дуусах сар"
                value={expMonth}
                onChangeText={(t) => setExpMonth(t.replace(/\D/g, "").slice(0, 2))}
                keyboardType="number-pad"
                placeholder="12"
              />
            </View>
            <View className="flex-1">
              <Input
                label="Дуусах он"
                value={expYear}
                onChangeText={(t) => setExpYear(t.replace(/\D/g, "").slice(0, 4))}
                keyboardType="number-pad"
                placeholder="2028"
              />
            </View>
          </View>
        </Card>

        <Button label="Карт хадгалах" loading={submitting} onPress={onSubmit} className="shadow-md" />
        <Text className="mt-3 text-center text-xs leading-5 text-app-text-muted">
          Жинхэнэ төлбөр биш — MVP-д зөвхөн жишээ төлбөр баталгаажуулна.
        </Text>
        <Button label="Буцах" variant="ghost" className="mt-6" onPress={() => router.back()} />
      </FormScrollView>
    </>
  );
}
