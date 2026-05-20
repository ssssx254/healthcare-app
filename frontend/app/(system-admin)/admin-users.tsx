import { Card, EmptyState, ErrorState, LoadingState, ScreenScrollView, SectionHeader } from "@/components";
import { toFriendlyErrorMn } from "@/lib/friendlyErrorMn";
import { adminApi, type AdminUserRow } from "@/services/api/adminApi";
import { Tabs } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";

export default function AdminUsersScreen() {
  const [customers, setCustomers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { items } = await adminApi.listUsers({ role: "customer", page: 1, page_size: 200 });
      setCustomers(items);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Хэрэглэгчдийн жагсаалт ачаалахад алдаа гарлаа.";
      setError(toFriendlyErrorMn(msg));
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <Tabs.Screen options={{ title: "Хэрэглэгчид" }} />
      <ScreenScrollView className="flex-1 bg-app-bg" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <SectionHeader title="Хэрэглэгчдийн жагсаалт" subtitle="Иргэдийн бүртгэлийг харах хэсэг." />
        {loading ? (
          <Card className="mb-3">
            <LoadingState compact withSkeleton title="Хэрэглэгчдийн жагсаалт ачааллаж байна…" />
          </Card>
        ) : null}
        {error ? (
          <ErrorState className="mb-3" title="Жагсаалт ачаалагдсангүй" message={error} onRetry={load} retryLabel="Дахин оролдох" />
        ) : null}
        {!loading && !error && customers.length === 0 ? (
          <Card className="overflow-hidden">
            <EmptyState title="Хэрэглэгч алга" description="Одоогоор иргэн хэрэглэгч бүртгэгдээгүй байна." />
          </Card>
        ) : null}
        <View className="gap-3">
          {customers.map((u) => (
            <Card key={u.id}>
              <Text className="text-base font-semibold text-app-text">{u.full_name}</Text>
              <Text className="mt-1 text-xs text-app-text-muted">{u.email}</Text>
              <Text className="mt-1 text-xs text-app-text-muted">Утас: {u.phone ?? "—"}</Text>
              <Text className="mt-1 text-xs text-app-text-muted">
                Бүртгүүлсэн огноо: {u.created_at ? new Date(u.created_at).toLocaleDateString("mn-MN") : "—"}
              </Text>
            </Card>
          ))}
        </View>
      </ScreenScrollView>
    </>
  );
}

