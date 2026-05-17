import { Card, ScreenScrollView, SectionHeader } from "@/components";
import { Stack } from "expo-router";
import { Text, View } from "react-native";

export default function AppGuideScreen() {
  const steps = [
    "Эмнэлэг эсвэл эмчээ сонгоно.",
    "Үйлчилгээ сонгож цаг товлоно.",
    "Анкет бөглөж баталгаажуулна.",
    "Төлбөр төлөөд захиалгаа хянаж явна.",
  ];

  return (
    <>
      <Stack.Screen options={{ title: "Аппликэйшн ашиглах заавар" }} />
      <ScreenScrollView className="flex-1 bg-slate-50 dark:bg-slate-950" contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
        <SectionHeader title="Аппликэйшн ашиглах заавар" subtitle="Товч алхмуудаар тайлбарлав." />
        <Card>
          <View className="gap-3">
            {steps.map((step, idx) => (
              <Text key={step} className="text-sm leading-6 text-slate-700 dark:text-slate-300">
                {idx + 1}. {step}
              </Text>
            ))}
          </View>
        </Card>
      </ScreenScrollView>
    </>
  );
}

