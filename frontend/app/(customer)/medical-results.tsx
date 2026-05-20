import { Button, Card, EmptyState, ScreenScrollView, SectionHeader } from "@/components";
import { Stack, useRouter } from "expo-router";
import { Text, View } from "react-native";

export default function MedicalResultsScreen() {
  const router = useRouter();
  const hasResults = false;

  return (
    <>
      <Stack.Screen options={{ title: "Шинжилгээний хариу" }} />
      <ScreenScrollView className="flex-1 bg-app-bg" contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
        <SectionHeader title="Шинжилгээний хариу" subtitle="Хариу, огноо, эмчийн тайлбар энд харагдана." />

        {!hasResults ? (
          <Card>
            <EmptyState
              title="Шинжилгээний хариу алга"
              description="Одоогоор танд харах шинжилгээний хариу бүртгэгдээгүй байна."
              action={{ label: "Шинжилгээ рүү", onPress: () => router.push("/(customer)/consultations"), variant: "outline" }}
            />
          </Card>
        ) : (
          <View className="gap-3">
            <Card>
              <Text className="text-sm font-semibold text-app-text">Цусны дэлгэрэнгүй шинжилгээ</Text>
              <Text className="mt-1 text-xs text-app-text-muted">2026-04-19 · Нэгдсэн эмнэлэг</Text>
              <Text className="mt-2 text-xs text-app-text-secondary">Төлөв: Хэвийн</Text>
            </Card>
          </View>
        )}

        <Button label="Буцах" variant="ghost" className="mt-3" onPress={() => router.back()} />
      </ScreenScrollView>
    </>
  );
}

