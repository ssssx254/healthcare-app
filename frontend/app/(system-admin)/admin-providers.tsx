import { Badge, Button, Card, EmptyState, ErrorState, LoadingState, ScreenScrollView, SectionHeader } from "@/components";
import { toFriendlyErrorMn } from "@/lib/friendlyErrorMn";
import { adminApi, type AdminUserRow } from "@/services/api/adminApi";
import { Tabs } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";

export default function AdminProvidersScreen() {
  const [providers, setProviders] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { items } = await adminApi.listUsers({ role: "provider", page: 1, page_size: 200 });
      setProviders(items);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Үзүүлэгчийн жагсаалт ачаалахад алдаа гарлаа.";
      setError(toFriendlyErrorMn(msg));
      setProviders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onToggleSuspend = async (providerId: number, suspend: boolean) => {
    setActionId(providerId);
    setError(null);
    try {
      await adminApi.patchProviderSuspension(providerId, suspend);
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Үйлдэл амжилтгүй боллоо.";
      setError(toFriendlyErrorMn(msg));
    } finally {
      setActionId(null);
    }
  };

  return (
    <>
      <Tabs.Screen options={{ title: "Үзүүлэгч удирдлага" }} />
      <ScreenScrollView className="flex-1 bg-slate-50 dark:bg-slate-950" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <SectionHeader title="Үйлчилгээ үзүүлэгч удирдах" subtitle="Платформын хэмжээнд үзүүлэгчийн эрхийг удирдана." />
        {loading ? (
          <Card className="mb-3">
            <LoadingState compact withSkeleton title="Үзүүлэгчдийн жагсаалт ачааллаж байна…" />
          </Card>
        ) : null}
        {error ? (
          <ErrorState className="mb-3" title="Жагсаалт ачаалагдсангүй" message={error} onRetry={load} retryLabel="Дахин оролдох" />
        ) : null}
        {!loading && !error && providers.length === 0 ? (
          <Card className="mb-3 overflow-hidden">
            <EmptyState title="Үзүүлэгч алга" description="Одоогоор үйлчилгээ үзүүлэгч бүртгэгдээгүй байна." />
          </Card>
        ) : null}
        <View className="gap-3">
          {providers.map((item) => {
            const suspended = item.onboarding_status === "rejected";
            const busy = actionId === item.id;
            return (
            <Card key={item.id}>
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-semibold text-slate-900 dark:text-slate-50">{item.full_name}</Text>
                <Badge label={suspended ? "Түр түдгэлзсэн" : "Идэвхтэй"} tone={suspended ? "warning" : "success"} />
              </View>
              <Text className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.email}</Text>
              <Text className="mt-1 text-xs text-slate-500 dark:text-slate-400">Эмнэлэг: {item.clinic_name ?? "—"}</Text>
              <View className="mt-3 flex-row gap-2">
                <Button
                  label="Идэвхжүүлэх"
                  variant="outline"
                  className="flex-1"
                  disabled={busy || !suspended}
                  loading={busy && suspended}
                  onPress={() => void onToggleSuspend(Number(item.id), false)}
                />
                <Button
                  label="Түдгэлзүүлэх"
                  variant="secondary"
                  className="flex-1"
                  disabled={busy || suspended}
                  loading={busy && !suspended}
                  onPress={() => void onToggleSuspend(Number(item.id), true)}
                />
              </View>
            </Card>
          );
          })}
        </View>
      </ScreenScrollView>
    </>
  );
}

