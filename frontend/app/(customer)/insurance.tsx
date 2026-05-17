import { Button, Card, ScreenScrollView, SectionHeader } from "@/components";
import { Link, Stack } from "expo-router";
import { Text, View } from "react-native";

export default function InsuranceScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Даатгал" }} />
      <ScreenScrollView className="flex-1 bg-slate-50 dark:bg-slate-950" contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
        <SectionHeader title="Даатгал" subtitle="ЭМД болон нэмэлт даатгалын мэдээлэл." />

        <Card className="mb-3">
          <Text className="text-sm font-semibold text-slate-900 dark:text-slate-50">ЭМД эрх</Text>
          <Text className="mt-1 text-xs text-slate-500 dark:text-slate-400">Төлөв: Идэвхтэй (жишээ)</Text>
          <Text className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Эрхийн хугацаа: 2026-12-31 хүртэл. Хамрагдах үйлчилгээний жагсаалтыг эмнэлгийн дэлгэрэнгүйгээс харна уу.
          </Text>
        </Card>

        <Card className="mb-3">
          <Text className="text-sm font-semibold text-slate-900 dark:text-slate-50">Нэмэлт даатгал</Text>
          <Text className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Одоогоор нэмэлт даатгал холбогдоогүй. Дараа нь банк/даатгалын интеграц нэмэгдэнэ.
          </Text>
        </Card>

        <View className="gap-2">
          <Link href="/(customer)/appointments" asChild>
            <Button label="Цаг захиалах" />
          </Link>
          <Link href="/(customer)/clinics" asChild>
            <Button label="Эмнэлэг сонгох" variant="outline" />
          </Link>
        </View>
      </ScreenScrollView>
    </>
  );
}
