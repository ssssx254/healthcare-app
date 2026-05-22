import { Button, Card, EmptyState, ErrorState, LoadingState, ScreenScrollView, SectionHeader } from "@/components";
import { getLabTestStatusLabel } from "@/constants/labTestStatus";
import { useCustomerBooking } from "@/contexts/CustomerBookingContext";
import { labTestsApi, type LabTestRow } from "@/services/api/labTestsApi";
import { toFriendlyErrorMn } from "@/lib/friendlyErrorMn";
import { router, Stack } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function ShareLabTestsBookingScreen() {
  const { draft, setSharedLabTestIds } = useCustomerBooking();
  const [items, setItems] = useState<LabTestRow[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set(draft.sharedLabTestIds));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await labTestsApi.listMine("mine");
      setItems(res.items ?? []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Шинжилгээ ачааллахад алдаа гарлаа.";
      setError(toFriendlyErrorMn(msg));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onContinue = () => {
    setSharedLabTestIds([...selected]);
    router.push("/(customer)/booking/confirm");
  };

  const onSkip = () => {
    setSharedLabTestIds([]);
    router.push("/(customer)/booking/confirm");
  };

  return (
    <>
      <Stack.Screen options={{ title: "Шинжилгээ хуваалцах" }} />
      <ScreenScrollView className="flex-1 bg-app-bg" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <SectionHeader
          title="Шинжилгээ хуваалцах"
          subtitle="Эмч зөвхөн таны сонгосон шинжилгээг харах боломжтой. Сонгоогүй бол хувийн үлдэнэ."
        />

        <Card className="mb-4 border-brand-200 bg-brand-50/80 dark:border-brand-800 dark:bg-brand-950/40">
          <Text className="text-sm font-semibold text-brand-900 dark:text-brand-100">Эмчид хуваалцах</Text>
          <Text className="mt-1 text-xs text-brand-800 dark:text-brand-200">
            {draft.doctorName ? `Эмч: ${draft.doctorName}` : "Эмч"} — зөвхөн энэ захиалгад сонгосон файлууд харагдана.
          </Text>
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
              icon="flask-outline"
              title="Хуваалцах шинжилгээ алга"
              description="Эхлээд «Шинжилгээ» хэсэгт өөрийн шинжилгээ нэмнэ үү. Эсвэл алгасаж үргэлжлүүлж болно."
              action={{ label: "Алгасах", onPress: onSkip, variant: "outline" }}
            />
          </Card>
        ) : null}

        {!error && items.length > 0 ? (
          <View className="mb-4 gap-2">
            {items.map((item) => {
              const checked = selected.has(item.id);
              return (
                <Pressable key={item.id} onPress={() => toggle(item.id)}>
                  <Card className={checked ? "border-brand-500 bg-brand-50/50 dark:border-brand-400 dark:bg-brand-950/30" : ""}>
                    <View className="flex-row items-start gap-3">
                      <MaterialCommunityIcons
                        name={checked ? "checkbox-marked" : "checkbox-blank-outline"}
                        size={24}
                        color={checked ? "#2563eb" : "#94a3b8"}
                      />
                      <View className="min-w-0 flex-1">
                        <Text className="text-sm font-semibold text-app-text">{item.title}</Text>
                        <Text className="mt-1 text-xs text-app-text-muted">
                          {item.test_type} · {item.test_date}
                        </Text>
                        <Text className="mt-1 text-xs text-app-text-secondary">
                          {getLabTestStatusLabel(item.status, item.uploaded_by)}
                        </Text>
                      </View>
                    </View>
                  </Card>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <Button
          label={selected.size > 0 ? `Эмчид хуваалцах (${selected.size})` : "Сонголтгүй үргэлжлүүлэх"}
          onPress={onContinue}
        />
        <Button label="Алгасах" variant="ghost" className="mt-2" onPress={onSkip} />
        <Button label="Буцах" variant="ghost" className="mt-2" onPress={() => router.back()} />
      </ScreenScrollView>
    </>
  );
}
