import { Button, Card, EmptyState, ScreenScrollView, SectionHeader } from "@/components";
import { Link, Tabs, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

export default function ConsultationsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"my-tests" | "hospital">("my-tests");

  return (
    <ScreenScrollView className="flex-1 bg-slate-50 dark:bg-slate-950" contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
      <Tabs.Screen options={{ tabBarLabel: "Шинжилгээ", headerTitle: "" }} />
      <SectionHeader title="Шинжилгээ" subtitle="Шинжилгээний хариу, тэмдэглэл, эмнэлгийн мэдээлэл." />

      <Card className="mb-4">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-sm font-semibold text-slate-900 dark:text-slate-50">Шинжилгээ нэмэх</Text>
        </View>
        <Text className="text-xs text-slate-500 dark:text-slate-400">
          Шинэ шинжилгээ нэмээд дараа нь хариу, тайлангаа эндээс хянаарай.
        </Text>
        <Button label="Шинжилгээ нэмэх" className="mt-3" onPress={() => router.push("/(customer)/clinics")} />
      </Card>

      <Card className="mb-4">
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => setActiveTab("my-tests")}
            className={`flex-1 rounded-xl border px-3 py-2.5 ${
              activeTab === "my-tests"
                ? "border-brand-600 bg-brand-50 dark:border-brand-400 dark:bg-brand-900"
                : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
            }`}
          >
            <Text
              className={`text-center text-sm font-medium ${
                activeTab === "my-tests" ? "text-brand-700 dark:text-brand-300" : "text-slate-600 dark:text-slate-300"
              }`}
            >
              Миний шинжилгээ
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab("hospital")}
            className={`flex-1 rounded-xl border px-3 py-2.5 ${
              activeTab === "hospital"
                ? "border-brand-600 bg-brand-50 dark:border-brand-400 dark:bg-brand-900"
                : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
            }`}
          >
            <Text
              className={`text-center text-sm font-medium ${
                activeTab === "hospital" ? "text-brand-700 dark:text-brand-300" : "text-slate-600 dark:text-slate-300"
              }`}
            >
              Эмнэлэг
            </Text>
          </Pressable>
        </View>
      </Card>

      {activeTab === "my-tests" ? (
        <Card className="mb-4">
          <EmptyState
            icon="flask-outline"
            title="Шинжилгээний түүх алга"
            description="Одоогоор танд бүртгэгдсэн шинжилгээний хариу байхгүй байна."
            action={{ label: "Шинжилгээний хариу үзэх", onPress: () => router.push("/(customer)/medical-results"), variant: "outline" }}
          />
        </Card>
      ) : (
        <Card className="mb-4">
          <EmptyState
            icon="hospital-building"
            title="Эмнэлгийн мэдээлэл алга"
            description="Шинжилгээ хийсэн эмнэлгийн мэдээлэл одоогоор бүртгэгдээгүй байна."
            action={{ label: "Эмнэлэг сонгох", onPress: () => router.push("/(customer)/clinics"), variant: "outline" }}
          />
        </Card>
      )}

      <View className="gap-2">
        <Link href="/(customer)/medical-results" asChild>
          <Button label="Шинжилгээний хариу" variant="outline" />
        </Link>
        <Link href="/(customer)/doctor-notes" asChild>
          <Button label="Эмчийн тэмдэглэл" variant="ghost" />
        </Link>
      </View>
    </ScreenScrollView>
  );
}
