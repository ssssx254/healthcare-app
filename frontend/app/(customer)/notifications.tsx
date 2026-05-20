import { Badge, Button, Card, EmptyState, ErrorState, LoadingState, ScreenScrollView, SectionHeader } from "@/components";
import { routes } from "@/constants/appRoutes";
import { toFriendlyErrorMn } from "@/lib/friendlyErrorMn";
import { useAuth } from "@/hooks/useAuth";
import { notificationApi } from "@/services/api/notificationApi";
import type { Notification } from "@/types/healthcare";
import { router, Stack } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";

function mapRowToNotification(row: import("@/services/api/notificationApi").NotificationRow): Notification {
  const created = new Date(row.created_at);
  const timeLabel = Number.isNaN(created.getTime())
    ? row.created_at
    : created.toLocaleString("mn-MN", { dateStyle: "short", timeStyle: "short" });
  return {
    id: String(row.id),
    titleMn: row.title,
    bodyMn: row.body,
    timeLabelMn: timeLabel,
    audience: "customer",
    read: row.is_read === 1 || row.is_read === true,
    tone: "neutral",
  };
}

export default function NotificationsScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rows = await notificationApi.listMineAll();
      setItems(rows.map(mapRowToNotification));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Мэдэгдэл ачааллахад алдаа гарлаа.";
      setError(toFriendlyErrorMn(msg));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <Stack.Screen options={{ title: "Мэдэгдэл" }} />
      <ScreenScrollView
        className="flex-1 bg-app-bg"
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
      >
        <SectionHeader title="Мэдэгдэл" subtitle="Сануулга, төлбөр, системийн мэдээлэл." />
        <Button
          label="Мэдэгдлийн тохиргоо"
          variant="outline"
          className="mb-3"
          onPress={() => router.push(routes.customerNotificationSettings)}
        />
        {loading ? (
          <Card className="mb-3">
            <LoadingState compact withSkeleton title="Мэдэгдлүүдийг ачааллаж байна…" />
          </Card>
        ) : null}
        {error ? (
          <ErrorState
            className="mb-3"
            title="Мэдэгдэл ачаалагдаагүй"
            message={error}
            onRetry={load}
            retryLabel="Дахин оролдох"
          />
        ) : null}
        {!loading && !error && items.length === 0 ? (
          <Card className="overflow-hidden">
            <EmptyState
              icon="bell-outline"
              title="Мэдэгдэл байхгүй"
              description="Сануулга, төлбөрийн мэдэгдэл ирэхэд энд харагдана."
            />
          </Card>
        ) : null}
        {!loading && !error && items.length > 0 ? (
          <View className="gap-3">
            {items.map((n) => (
              <Card key={n.id}>
                <View className="flex-row items-start justify-between gap-2">
                  <Text
                    className="min-w-0 flex-1 text-base font-semibold text-app-text"
                  >
                    {n.titleMn}
                  </Text>
                  <Badge label={n.read ? "Уншсан" : "Шинэ"} tone={n.tone ?? "neutral"} />
                </View>
                <Text className="mt-2 text-sm leading-6 text-app-text-secondary">
                  {n.bodyMn}
                </Text>
                <Text className="mt-2 text-xs text-app-text-muted">{n.timeLabelMn}</Text>
              </Card>
            ))}
          </View>
        ) : null}
      </ScreenScrollView>
    </>
  );
}
