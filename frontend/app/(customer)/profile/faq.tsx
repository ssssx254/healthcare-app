import { Card, ScreenScrollView, SectionHeader } from "@/components";
import { Stack } from "expo-router";
import { Text, View } from "react-native";

export default function FaqScreen() {
  const faqs = [
    {
      q: "Цаг захиалга хэрхэн хийх вэ?",
      a: "Эмч эсвэл эмнэлгээ сонгоод үйлчилгээ, огноо, цаг сонгоод баталгаажуулна.",
    },
    {
      q: "Төлбөр амжилттай эсэхийг хаанаас харах вэ?",
      a: "Цаг захиалга болон Миний захиалгууд хэсгээс төлвөө шалгана.",
    },
    {
      q: "Захиалгаа цуцалж болох уу?",
      a: "Төлөв нь хүлээгдэж буй үед захиалгын дэлгэрэнгүйгээс цуцлах боломжтой.",
    },
  ];

  return (
    <>
      <Stack.Screen options={{ title: "Түгээмэл асуулт, хариулт" }} />
      <ScreenScrollView className="flex-1 bg-app-bg" contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
        <SectionHeader title="Түгээмэл асуулт, хариулт" subtitle="Хэрэглэгчдээс хамгийн их асуудаг асуултууд." />
        <View className="gap-3">
          {faqs.map((f) => (
            <Card key={f.q}>
              <Text className="text-sm font-semibold text-app-text">{f.q}</Text>
              <Text className="mt-2 text-sm leading-6 text-app-text-secondary">{f.a}</Text>
            </Card>
          ))}
        </View>
      </ScreenScrollView>
    </>
  );
}

