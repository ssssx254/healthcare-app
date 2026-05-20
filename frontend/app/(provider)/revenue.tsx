import {
  Card,
  COMPACT_STAT_CARD_HEIGHT,
  EmptyState,
  ErrorState,
  LoadingState,
  ScreenScrollView,
  SectionHeader,
  StatCard,
} from "@/components";
import { ApiError } from "@/lib/api/client";
import { providerBookingStatusLabel } from "@/constants/providerBookingStatus";
import { useProviderWorkspace } from "@/contexts/ProviderWorkspaceContext";
import { providerApi } from "@/services/api/providerApi";
import { Stack } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";

type ProviderStatsView = {
  totalBookings: number;
  confirmed: number;
  cancelled: number;
  completed: number;
  totalRevenueMnt: number;
  topServiceName: string;
};

export default function ProviderRevenueScreen() {
  const { bookings, totalRevenueMnt, totalCustomers, todayBookingsCount, pendingRequestsCount } =
    useProviderWorkspace();
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [stats, setStats] = useState<ProviderStatsView | null>(null);

  const formalConfirmed = useMemo(
    () => bookings.filter((b) => b.kind === "formal" && b.providerStatus === "confirmed"),
    [bookings],
  );

  const freeConfirmed = useMemo(
    () => bookings.filter((b) => b.kind === "free_online" && b.providerStatus === "confirmed"),
    [bookings],
  );

  const byStatus = useMemo(() => {
    const map: Partial<Record<keyof typeof providerBookingStatusLabel, number>> = {};
    for (const b of bookings) {
      const k = b.providerStatus;
      map[k] = (map[k] ?? 0) + 1;
    }
    return map;
  }, [bookings]);

  const localComputedStats = useMemo<ProviderStatsView>(() => {
    const total = bookings.length;
    const confirmed = bookings.filter((b) => b.providerStatus === "confirmed").length;
    const cancelled = bookings.filter((b) => b.providerStatus === "cancelled_clinic" || b.providerStatus === "rejected").length;
    const completed = bookings.filter((b) => b.providerStatus === "completed").length;
    const revenue = bookings
      .filter((b) => b.kind === "formal" && (b.providerStatus === "confirmed" || b.providerStatus === "completed"))
      .reduce((sum, b) => sum + Number(b.priceMnt || 0), 0);
    const serviceCounter = new Map<string, number>();
    for (const b of bookings) {
      const key = b.serviceTitle?.trim() || "Үйлчилгээ тодорхойгүй";
      serviceCounter.set(key, (serviceCounter.get(key) ?? 0) + 1);
    }
    const topServiceName = [...serviceCounter.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Өгөгдөл алга";
    return {
      totalBookings: total,
      confirmed,
      cancelled,
      completed,
      totalRevenueMnt: revenue,
      topServiceName,
    };
  }, [bookings]);

  useEffect(() => {
    let alive = true;
    setStatsLoading(true);
    setStatsError(null);
    providerApi
      .getStats()
      .then((remote) => {
        if (!alive) return;
        setStats({
          totalBookings: Number(remote.total_bookings || 0),
          confirmed: Number(remote.confirmed || 0),
          cancelled: Number(
            remote.cancelled ??
              Math.max(
                0,
                Number(remote.total_bookings || 0) -
                  Number(remote.pending || 0) -
                  Number(remote.confirmed || 0) -
                  Number(remote.completed || 0),
              ),
          ),
          completed: Number(remote.completed || 0),
          totalRevenueMnt: Number(remote.revenue_total ?? remote.total_revenue_mnt ?? 0),
          topServiceName: remote.top_service_name?.trim() || "Өгөгдөл алга",
        });
      })
      .catch((e) => {
        if (!alive) return;
        if (e instanceof ApiError && (e.status === 404 || e.status === 405)) {
          setStats(localComputedStats);
          return;
        }
        setStats(localComputedStats);
        setStatsError(e instanceof Error ? e.message : "Статистик ачаалахад алдаа гарлаа.");
      })
      .finally(() => {
        if (alive) setStatsLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [localComputedStats]);

  return (
    <>
      <Stack.Screen options={{ title: "Орлого / статистик" }} />
      <ScreenScrollView
        className="flex-1 bg-app-bg"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      >
        <SectionHeader title="Статистик" subtitle="Захиалга, төлөв, орлогын үзүүлэлтүүд." />

        {statsError ? (
          <ErrorState className="mb-4" title="Статистик ачаалсангүй" message={statsError} />
        ) : null}
        {statsLoading ? (
          <Card className="mb-4">
            <LoadingState compact title="Статистик ачааллаж байна…" subtitle="Түр хүлээнэ үү." />
          </Card>
        ) : null}
        {!statsLoading && !stats ? (
          <Card className="mb-4 overflow-hidden">
            <EmptyState icon="chart-line" title="Статистикийн мэдээлэл алга" description="Захиалгын өгөгдөл бүртгэгдсэний дараа энд харагдана." />
          </Card>
        ) : null}

        {stats ? (
          <>
            <View
              className="mb-4"
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "space-between",
                alignItems: "flex-start",
                rowGap: 10,
                columnGap: 10,
              }}
            >
              <View style={{ width: "48%", height: COMPACT_STAT_CARD_HEIGHT }}>
                <StatCard compact fillContainer title="Нийт захиалга" value={String(stats.totalBookings)} hint="Бүх төрөл" />
              </View>
              <View style={{ width: "48%", height: COMPACT_STAT_CARD_HEIGHT }}>
                <StatCard compact fillContainer title="Баталгаажсан" value={String(stats.confirmed)} hint="Идэвхтэй" />
              </View>
              <View style={{ width: "48%", height: COMPACT_STAT_CARD_HEIGHT }}>
                <StatCard compact fillContainer title="Цуцлагдсан" value={String(stats.cancelled)} hint="Цуцалсан/татгалзсан" />
              </View>
              <View style={{ width: "48%", height: COMPACT_STAT_CARD_HEIGHT }}>
                <StatCard compact fillContainer title="Дууссан" value={String(stats.completed)} hint="Хаагдсан захиалга" />
              </View>
              <View style={{ width: "48%", height: COMPACT_STAT_CARD_HEIGHT }}>
                <StatCard
                  compact
                  fillContainer
                  title="Нийт орлого"
                  value={`${stats.totalRevenueMnt.toLocaleString("mn-MN")} ₮`}
                  hint="Баталгаажсан/дууссан"
                />
              </View>
              <View style={{ width: "48%", height: COMPACT_STAT_CARD_HEIGHT }}>
                <StatCard compact fillContainer title="Их захиалагдсан үйлчилгээ" value={stats.topServiceName} hint="Топ үйлчилгээ" />
              </View>
            </View>
          </>
        ) : null}

        <Card className="mb-3">
          <Text className="text-sm font-semibold text-app-text">Төлөвөөр</Text>
          <View className="mt-3 gap-2">
            {(Object.keys(byStatus) as (keyof typeof providerBookingStatusLabel)[]).map((k) => (
              <View key={k} className="flex-row items-center justify-between">
                <Text className="text-sm text-app-text-secondary">{providerBookingStatusLabel[k]}</Text>
                <Text className="text-sm font-semibold text-app-text">{byStatus[k] ?? 0}</Text>
              </View>
            ))}
          </View>
        </Card>

        <Card className="mb-3">
          <Text className="text-sm font-semibold text-app-text">Үйлчилгээний төрөл</Text>
          <Text className="mt-2 text-sm text-app-text-secondary">
            Албан ёсны баталгаажсан: {formalConfirmed.length} · Үнэгүй онлайн баталгаажсан: {freeConfirmed.length}
          </Text>
          <Text className="mt-2 text-xs text-app-text-muted">
            Өнөөдөр: {todayBookingsCount} · Хүлээгдэж буй: {pendingRequestsCount} · Үйлчлүүлэгч: {totalCustomers} · Орлого:{" "}
            {totalRevenueMnt.toLocaleString("mn-MN")} ₮
          </Text>
        </Card>
      </ScreenScrollView>
    </>
  );
}
