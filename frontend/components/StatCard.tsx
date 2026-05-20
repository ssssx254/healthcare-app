import { cn } from "@/utils/cn";
import { Text, View, type StyleProp, type ViewStyle } from "react-native";
import { Card } from "./Card";

/** Профайл статистик grid — бүх карт ижил хэмжээтэй */
export const COMPACT_STAT_CARD_HEIGHT = 96;

export type StatCardProps = {
  title: string;
  value: string;
  hint?: string;
  /** Компакт хэмжээ — профайл статистик grid-д */
  compact?: boolean;
  /** Эцэг View өндөрт бүтэн дүүрнэ (grid-д) */
  fillContainer?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

export function StatCard({
  title,
  value,
  hint,
  compact = false,
  fillContainer = false,
  className,
  style,
}: StatCardProps) {
  const uniform = compact && fillContainer;

  return (
    <Card
      className={cn(
        "min-w-0",
        compact && !uniform && "self-start p-3",
        uniform && "h-full justify-between p-3",
        className,
      )}
      style={[uniform ? { height: "100%" } : undefined, style]}
    >
      <View className={uniform ? "flex-1 justify-between" : undefined}>
        <Text
          className={cn(
            "font-semibold uppercase tracking-wide text-app-text-muted",
            compact ? "text-[10px] leading-3" : "text-[11px]",
            uniform && "min-h-[26px]",
          )}
          numberOfLines={2}
        >
          {title}
        </Text>
        <Text
          className={cn(
            "font-bold tabular-nums tracking-tight text-app-text",
            compact ? "text-lg leading-6" : "mt-2 text-2xl",
            uniform ? "my-1" : compact ? "mt-1" : undefined,
          )}
          numberOfLines={1}
          adjustsFontSizeToFit={compact}
          minimumFontScale={compact ? 0.65 : 0.75}
        >
          {value}
        </Text>
        {hint ? (
          <Text
            className={cn(
              "text-app-text-muted",
              compact ? "text-[10px] leading-3" : "mt-1.5 text-[11px] leading-4",
              uniform && "min-h-[14px]",
            )}
            numberOfLines={1}
          >
            {hint}
          </Text>
        ) : (
          uniform ? <View className="min-h-[14px]" /> : null
        )}
      </View>
    </Card>
  );
}
