import { Button, Card, FormScrollView, SectionHeader } from "@/components";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import type { ComponentProps } from "react";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

type PaymentMethod = "wallet" | "qpay" | "bank_card" | "saved_card";

const METHODS: Array<{
  id: PaymentMethod;
  label: string;
  subtitle: string;
  icon: ComponentProps<typeof MaterialCommunityIcons>["name"];
  accent: string;
  iconColor: string;
}> = [
  {
    id: "wallet",
    label: "Цахим данс",
    subtitle: "Хэтэвчийн үлдэгдлээс шууд суутгах",
    icon: "wallet-outline",
    accent: "bg-emerald-50 dark:bg-emerald-950/40",
    iconColor: "#059669",
  },
  {
    id: "qpay",
    label: "КьюПэй",
    subtitle: "QR, банкны апп (жишээ урсгал)",
    icon: "qrcode",
    accent: "bg-violet-50 dark:bg-violet-950/40",
    iconColor: "#7c3aed",
  },
  {
    id: "bank_card",
    label: "Банкны карт",
    subtitle: "Шинэ карт хадгалах (сүүлийн 4 орон)",
    icon: "credit-card-plus-outline",
    accent: "bg-amber-50 dark:bg-amber-950/40",
    iconColor: "#d97706",
  },
  {
    id: "saved_card",
    label: "Хадгалсан карт",
    subtitle: "Өмнө хадгалсан Visa/Mastercard",
    icon: "credit-card-outline",
    accent: "bg-sky-50 dark:bg-sky-950/40",
    iconColor: "#0284c7",
  },
];

export default function PaymentMethodScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const [selected, setSelected] = useState<PaymentMethod>("wallet");

  const onContinue = () => {
    if (selected === "qpay") {
      router.push({ pathname: "/booking/qpay-booking", params: { orderId } });
      return;
    }
    if (selected === "bank_card") {
      router.push({ pathname: "/(customer)/payment-methods/add-card", params: { returnTo: "booking", orderId } });
      return;
    }
    router.push({
      pathname: "/booking/account-info",
      params: { orderId, method: selected },
    });
  };

  return (
    <>
      <Stack.Screen options={{ title: "Төлбөрийн арга" }} />
      <FormScrollView className="flex-1 px-5 pt-5 bg-app-bg" contentContainerStyle={{ paddingBottom: 40 }}>
        <SectionHeader title="Төлбөрийн арга" subtitle="Нэгийг сонгоно. Хэрэгтэй бол дараа нь солино." />

        <View className="gap-3">
          {METHODS.map((m) => {
            const active = selected === m.id;
            return (
              <Pressable key={m.id} onPress={() => setSelected(m.id)} className="active:opacity-95">
                <Card
                  className={
                    active
                      ? "border-2 border-brand-600 shadow-md dark:border-brand-400"
                      : "border border-app-border"
                  }
                >
                  <View className="flex-row items-center gap-4">
                    <View className={`h-14 w-14 items-center justify-center rounded-2xl ${m.accent}`}>
                      <MaterialCommunityIcons name={m.icon} size={28} color={m.iconColor} />
                    </View>
                    <View className="min-w-0 flex-1">
                      <Text className="text-base font-bold text-app-text">{m.label}</Text>
                      <Text className="mt-1 text-xs leading-5 text-app-text-muted">{m.subtitle}</Text>
                    </View>
                    <View
                      className={`h-6 w-6 items-center justify-center rounded-full border-2 ${
                        active ? "border-brand-600 bg-brand-600 dark:border-brand-400 dark:bg-brand-500" : "border-app-border-strong"
                      }`}
                    >
                      {active ? <MaterialCommunityIcons name="check" size={14} color="#fff" /> : null}
                    </View>
                  </View>
                </Card>
              </Pressable>
            );
          })}
        </View>

        <Button label="Үргэлжлүүлэх" className="mt-8 shadow-md" onPress={onContinue} />
      </FormScrollView>
    </>
  );
}
