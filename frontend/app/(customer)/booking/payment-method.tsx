import { Button, Card, FormScrollView, SectionHeader } from "@/components";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import type { ComponentProps } from "react";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

type PaymentMethod = "most_money" | "qpay" | "bank_card" | "wallet";

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
    subtitle: "Аппын хэтэвчээс шууд суутгах",
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
    id: "most_money",
    label: "Мост мани",
    subtitle: "Данс холбох төлбөрийн апп (жишээ)",
    icon: "cellphone-link",
    accent: "bg-sky-50 dark:bg-sky-950/40",
    iconColor: "#0284c7",
  },
  {
    id: "bank_card",
    label: "Банкны карт",
    subtitle: "Виза, Мастер карт (жишээ)",
    icon: "credit-card-outline",
    accent: "bg-amber-50 dark:bg-amber-950/40",
    iconColor: "#d97706",
  },
];

export default function PaymentMethodScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const [selected, setSelected] = useState<PaymentMethod>("wallet");

  return (
    <>
      <Stack.Screen options={{ title: "Төлбөрийн арга" }} />
      <FormScrollView className="flex-1 bg-slate-50 px-5 pt-5 dark:bg-slate-950" contentContainerStyle={{ paddingBottom: 40 }}>
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
                      : "border border-slate-200 dark:border-slate-700"
                  }
                >
                  <View className="flex-row items-center gap-4">
                    <View className={`h-14 w-14 items-center justify-center rounded-2xl ${m.accent}`}>
                      <MaterialCommunityIcons name={m.icon} size={28} color={m.iconColor} />
                    </View>
                    <View className="min-w-0 flex-1">
                      <Text className="text-base font-bold text-slate-900 dark:text-slate-50">{m.label}</Text>
                      <Text className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{m.subtitle}</Text>
                    </View>
                    <View
                      className={`h-6 w-6 items-center justify-center rounded-full border-2 ${
                        active ? "border-brand-600 bg-brand-600 dark:border-brand-400 dark:bg-brand-500" : "border-slate-300 dark:border-slate-600"
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

        <Button
          label="Үргэлжлүүлэх"
          className="mt-8 shadow-md"
          onPress={() =>
            router.push({
              pathname: "/booking/account-info",
              params: { orderId, method: selected },
            })
          }
        />
      </FormScrollView>
    </>
  );
}
