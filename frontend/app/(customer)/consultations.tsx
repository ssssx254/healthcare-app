import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  ScreenScrollView,
  SectionHeader,
} from "@/components";
import {
  getLabTestSourceLabel,
  getLabTestStatusLabel,
  labTestStatusTone,
} from "@/constants/labTestStatus";
import { labTestsApi, type LabTestRow } from "@/services/api/labTestsApi";
import { toFriendlyErrorMn } from "@/lib/friendlyErrorMn";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { Tabs, router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";

type LabTab = "my-tests" | "hospital";

function LabTestListItem({ item, onPress }: { item: LabTestRow; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <View className="rounded-xl border border-app-border bg-app-muted/80 px-3 py-3">
        <View className="flex-row items-start justify-between gap-2">
          <Text className="flex-1 text-sm font-semibold text-app-text" numberOfLines={2}>
            {item.title}
          </Text>
          <Badge
            label={getLabTestStatusLabel(item.status, item.uploaded_by)}
            tone={labTestStatusTone(item.status, item.uploaded_by)}
          />
        </View>
        <Text className="mt-1 text-xs text-app-text-muted">
          {getLabTestSourceLabel(item.uploaded_by)}
          {item.test_type ? ` · ${item.test_type}` : ""} · {item.test_date}
          {item.clinic_name ? ` · ${item.clinic_name}` : ""}
        </Text>
      </View>
    </Pressable>
  );
}

export default function ConsultationsScreen() {
  const { isOnline, cacheServedAt } = useNetworkStatus();
  const [activeTab, setActiveTab] = useState<LabTab>("my-tests");
  const [items, setItems] = useState<LabTestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filter = activeTab === "my-tests" ? "mine" : "clinic";

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await labTestsApi.listMine(filter);
      setItems(res.items ?? []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Шинжилгээ ачааллахад алдаа гарлаа.";
      setError(toFriendlyErrorMn(msg));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <ScreenScrollView className="flex-1 bg-app-bg" contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
      <Tabs.Screen options={{ tabBarLabel: "Шинжилгээ", headerTitle: "" }} />
      <SectionHeader title="Шинжилгээ" subtitle="Миний шинжилгээ, эмнэлгээс ирсэн хариу, шинэ бүртгэл." />

      {!isOnline ? (
        <Card className="mb-4 border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950">
          <Text className="text-xs text-amber-900 dark:text-amber-100">
            Офлайн горим{cacheServedAt ? " — өмнөх өгөгдөл харагдаж болно" : ""}. Зарим үйлдэл ажиллахгүй.
          </Text>
        </Card>
      ) : null}

      <Card className="mb-4">
        <Text className="text-sm font-semibold text-app-text">Шинжилгээ нэмэх</Text>
        <Text className="mt-1 text-xs text-app-text-muted">Гарчиг, төрөл, огноо, тайлбар, PDF эсвэл зураг хавсаргана.</Text>
        <Button
          label="Шинжилгээ нэмэх"
          className="mt-3"
          onPress={() => router.push("/(customer)/lab-tests/add" as never)}
        />
      </Card>

      <Card className="mb-4">
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => setActiveTab("my-tests")}
            className={`flex-1 rounded-xl border px-3 py-2.5 ${
              activeTab === "my-tests"
                ? "border-brand-600 bg-brand-50 dark:border-brand-400 dark:bg-brand-900"
                : "border-app-border bg-app-card"
            }`}
          >
            <Text
              className={`text-center text-sm font-medium ${
                activeTab === "my-tests" ? "text-brand-700 dark:text-brand-300" : "text-app-text-secondary"
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
                : "border-app-border bg-app-card"
            }`}
          >
            <Text
              className={`text-center text-sm font-medium ${
                activeTab === "hospital" ? "text-brand-700 dark:text-brand-300" : "text-app-text-secondary"
              }`}
            >
              Эмнэлгээс ирсэн
            </Text>
          </Pressable>
        </View>
      </Card>

      {error ? (
        <ErrorState className="mb-4" title="Ачаалагдаагүй" message={error} onRetry={() => void load()} retryLabel="Дахин оролдох" />
      ) : null}

      {loading && items.length === 0 && !error ? (
        <Card className="mb-4">
          <LoadingState compact title="Шинжилгээ ачааллаж байна…" />
        </Card>
      ) : null}

      {!loading && !error && items.length === 0 ? (
        <Card className="mb-4 overflow-hidden">
          <EmptyState
            icon={activeTab === "my-tests" ? "flask-outline" : "hospital-building"}
            title={activeTab === "my-tests" ? "Миний шинжилгээ алга" : "Эмнэлгээс ирсэн мэдээлэл алга"}
            description={
              activeTab === "my-tests"
                ? "Шинэ шинжилгээ нэмээд эмнэлэгт илгээнэ үү."
                : "Эмнэлэг шинжилгээний хариу оруулахад энд харагдана."
            }
            action={{
              label: activeTab === "my-tests" ? "Шинжилгээ нэмэх" : "Эмнэлгүүд",
              onPress: () =>
                activeTab === "my-tests"
                  ? router.push("/(customer)/lab-tests/add" as never)
                  : router.push("/(customer)/clinics" as never),
              variant: "outline",
            }}
          />
        </Card>
      ) : null}

      {!error && items.length > 0 ? (
        <View className="gap-3">
          {items.map((item) => (
            <LabTestListItem
              key={item.id}
              item={item}
              onPress={() => router.push(`/(customer)/lab-tests/${item.id}` as never)}
            />
          ))}
        </View>
      ) : null}
    </ScreenScrollView>
  );
}
