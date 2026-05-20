import { Text, View } from "react-native";

export type SimpleBarChartItem = {
  label: string;
  value: number;
  color: string;
};

export type SimpleBarChartProps = {
  items: SimpleBarChartItem[];
  title?: string;
};

/** Expo Go–compatible bar chart (no native chart libs). */
export function SimpleBarChart({ items, title }: SimpleBarChartProps) {
  const max = Math.max(...items.map((i) => i.value), 1);
  const hasAny = items.some((i) => i.value > 0);

  if (!hasAny) {
    return (
      <Text className="text-center text-sm text-app-text-muted">
        Захиалгын түүх хараахан байхгүй байна.
      </Text>
    );
  }

  return (
    <View>
      {title ? (
        <Text className="mb-3 text-xs font-semibold uppercase tracking-wide text-app-text-muted">
          {title}
        </Text>
      ) : null}
      <View className="gap-3">
        {items.map((item) => {
          const pct = Math.max(4, Math.round((item.value / max) * 100));
          return (
            <View key={item.label}>
              <View className="mb-1 flex-row items-center justify-between gap-2">
                <Text className="min-w-0 flex-1 text-xs text-app-text-secondary" numberOfLines={1}>
                  {item.label}
                </Text>
                <Text className="text-xs font-bold tabular-nums text-app-text">{item.value}</Text>
              </View>
              <View className="h-2.5 overflow-hidden rounded-full dark:bg-slate-700">
                <View
                  className="h-2.5 rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: item.color }}
                />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
