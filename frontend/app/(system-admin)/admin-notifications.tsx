import { Badge, Button, Card, EmptyState, ErrorState, LoadingState, ScreenScrollView, SectionHeader } from "@/components";
import { toFriendlyErrorMn } from "@/lib/friendlyErrorMn";
import { notificationApi, type NotificationRow } from "@/services/api/notificationApi";
import { Tabs } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

function formatTimeLabel(value: string): string {
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return value;
  return dt.toLocaleString("mn-MN", { dateStyle: "short", timeStyle: "short" });
}

export default function AdminNotificationsScreen() {
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await notificationApi.listMineAll();
      setItems(rows);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Мэдэгдэл ачааллахад алдаа гарлаа.";
      setError(toFriendlyErrorMn(msg));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const markRead = useCallback(async (id: number) => {
    try {
      await notificationApi.markRead(id);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch {
      // Ignore one-off read error; user can refresh.
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setMarkingAll(true);
    try {
      await notificationApi.markAllRead();
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Мэдэгдэл шинэчлэхэд алдаа гарлаа.";
      setError(toFriendlyErrorMn(msg));
    } finally {
      setMarkingAll(false);
    }
  }, []);

  return (
    <>
      <Tabs.Screen options={{ title: "Мэдэгдэл" }} />
      <ScreenScrollView className="flex-1 bg-app-bg" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <SectionHeader title="Админы мэдэгдэл" subtitle="Системийн анхааруулга, шинэчлэлт, мэдэгдлүүд." />
        <Button
          label={markingAll ? "Түр хүлээнэ үү…" : "Бүгдийг уншсан болгох"}
          variant="outline"
          className="mb-3"
          disabled={markingAll || items.length === 0}
          onPress={() => void markAllRead()}
        />
        {loading ? (
          <Card className="mb-3">
            <LoadingState compact withSkeleton title="Мэдэгдэл ачааллаж байна…" />
          </Card>
        ) : null}
        {error ? (
          <ErrorState className="mb-3" title="Мэдэгдэл ачаалагдсангүй" message={error} onRetry={load} retryLabel="Дахин оролдох" />
        ) : null}
        {!loading && !error && items.length === 0 ? (
          <Card className="overflow-hidden">
            <EmptyState icon="bell-outline" title="Мэдэгдэл байхгүй" description="Админы шинэ мэдэгдэл ирэхэд энд харагдана." />
          </Card>
        ) : null}
        <View className="gap-3">
          {items.map((item) => {
            const read = item.is_read === true || item.is_read === 1;
            return (
              <Pressable key={item.id} onPress={() => void markRead(item.id)}>
                <Card className={read ? "" : "border-brand-300 dark:border-brand-700"}>
                  <View className="flex-row items-start justify-between gap-2">
                    <Text className="min-w-0 flex-1 text-sm font-semibold text-app-text">{item.title}</Text>
                    <Badge label={read ? "Уншсан" : "Шинэ"} tone={read ? "neutral" : "warning"} />
                  </View>
                  <Text className="mt-2 text-sm leading-6 text-app-text-secondary">{item.body}</Text>
                  <Text className="mt-2 text-xs text-app-text-muted">{formatTimeLabel(item.created_at)}</Text>
                </Card>
              </Pressable>
            );
          })}
        </View>
      </ScreenScrollView>
    </>
  );
}

