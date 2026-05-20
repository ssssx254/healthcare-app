import {
  Card,
  EmptyState,
  ErrorState,
  ListSkeleton,
  SectionHeader,
  SimpleBarChart,
  StatCard,
  COMPACT_STAT_CARD_HEIGHT,
} from "@/components";
import { toFriendlyErrorMn } from "@/lib/friendlyErrorMn";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { statsApi, type CustomerStatsResponse } from "@/services/api/statsApi";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import { Text, View } from "react-native";

function formatMnt(amount: number): string {
  return `${amount.toLocaleString("mn-MN")} ₮`;
}

function isStatsEmpty(data: CustomerStatsResponse): boolean {
  return data.total_bookings === 0 && data.online_consultations_count === 0;
}

const STAT_GRID_GAP = 10;
const STAT_COL_WIDTH = "48%";

function chunkPairs<T>(items: T[]): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += 2) {
    rows.push(items.slice(i, i + 2));
  }
  return rows;
}

export function CustomerStatsSection() {
  const { isOnline, cacheServedAt } = useNetworkStatus();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<CustomerStatsResponse | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setLoading(true);
      const data = await statsApi.customer();
      setStats(data);
    } catch (e) {
      const msg = toFriendlyErrorMn(e instanceof Error ? e.message : "Статистик ачааллахад алдаа гарлаа.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const showOfflineCacheHint = (!isOnline || Boolean(cacheServedAt)) && stats && !loading;

  const chartItems = useMemo(() => {
    if (!stats) return [];
    return [
      { label: "Хүлээгдэж буй", value: stats.pending_bookings, color: "#f59e0b" },
      { label: "Баталгаажсан", value: stats.confirmed_bookings, color: "#2563eb" },
      { label: "Дууссан", value: stats.completed_bookings, color: "#059669" },
      { label: "Цуцлагдсан", value: stats.cancelled_bookings, color: "#94a3b8" },
    ];
  }, [stats]);

  const statTiles = useMemo(() => {
    if (!stats) return [];
    return [
      { key: "total", title: "Нийт захиалга", value: String(stats.total_bookings), hint: "Бүх төлөв" },
      { key: "confirmed", title: "Баталгаажсан", value: String(stats.confirmed_bookings), hint: "Идэвхтэй цаг" },
      { key: "completed", title: "Дууссан үзлэг", value: String(stats.completed_bookings), hint: "Хаагдсан" },
      { key: "cancelled", title: "Цуцлагдсан", value: String(stats.cancelled_bookings), hint: "Цуцалсан" },
      { key: "wallet", title: "Wallet үлдэгдэл", value: formatMnt(stats.wallet_balance), hint: "Цахим данс" },
      { key: "paid", title: "Нийт төлбөр", value: formatMnt(stats.paid_amount_total), hint: "Төлсөн нийлбэр" },
      {
        key: "chat",
        title: "Онлайн зөвлөгөө",
        value: String(stats.online_consultations_count),
        hint: "Чатын тоо",
      },
    ];
  }, [stats]);

  return (
    <View className="mb-4">
      <SectionHeader
        title="Миний статистик"
        subtitle="Захиалга, төлбөр, онлайн зөвлөгөөний тойм."
        subtitleClassName="mt-1.5"
      />

      {showOfflineCacheHint ? (
        <Card className="mb-3 border-amber-200 bg-amber-50/90 dark:border-amber-900/50 dark:bg-amber-950/30">
          <Text className="text-xs leading-5 text-amber-900 dark:text-amber-100">
            {!isOnline
              ? "Офлайн горим: сүүлд хадгалсан статистикийг харуулж байна. Шинэчлэхийн тулд интернетэд холбогдоорой."
              : "Сүүлд татсан статистик — сүлжээ тогтворгүй үед кэш ашигласан байж болно."}
          </Text>
        </Card>
      ) : null}

      {error ? (
        <ErrorState
          className="mb-3"
          title="Статистик ачаалагдаагүй"
          message={error}
          onRetry={() => void load()}
          retryLabel="Дахин ачаалах"
        />
      ) : null}

      {loading && !stats ? <ListSkeleton rows={2} /> : null}

      {!loading && stats && isStatsEmpty(stats) ? (
        <Card>
          <EmptyState
            icon="chart-box-outline"
            title="Статистик хоосон байна"
            description="Эхний захиалга эсвэл онлайн зөвлөгөө хийсний дараа энд тоо харагдана."
          />
        </Card>
      ) : null}

      {stats && !isStatsEmpty(stats) ? (
        <>
          <View style={{ gap: STAT_GRID_GAP }}>
            {chunkPairs(statTiles).map((row, rowIndex) => (
              <View
                key={`stat-row-${rowIndex}`}
                style={{
                  flexDirection: "row",
                  justifyContent: row.length === 1 ? "center" : "space-between",
                  columnGap: STAT_GRID_GAP,
                }}
              >
                {row.map((tile) => (
                  <View
                    key={tile.key}
                    style={{ width: STAT_COL_WIDTH, height: COMPACT_STAT_CARD_HEIGHT }}
                  >
                    <StatCard
                      compact
                      fillContainer
                      title={tile.title}
                      value={tile.value}
                      hint={tile.hint}
                    />
                  </View>
                ))}
              </View>
            ))}
          </View>

          <Card className="mt-3 p-4">
            <SimpleBarChart title="Захиалгын төлөв" items={chartItems} />
          </Card>
        </>
      ) : null}
    </View>
  );
}
