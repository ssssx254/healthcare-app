import { cn } from "@/utils/cn";
import { ActivityIndicator, Text, View } from "react-native";
import { ListSkeleton } from "./ListSkeleton";

export type LoadingStateProps = {
  /** Гол гарчиг */
  title?: string;
  /** Нэмэлт тайлбар */
  subtitle?: string;
  className?: string;
  /** Жижиг inline (жагсаалтын дээр) */
  compact?: boolean;
  /** Жагсаалтын skeleton харуулах */
  withSkeleton?: boolean;
};

export function LoadingState({
  title = "Ачааллаж байна…",
  subtitle,
  className,
  compact,
  withSkeleton,
}: LoadingStateProps) {
  return (
    <View
      className={cn("items-center justify-center", compact ? "py-6" : "py-10", className)}
      accessibilityRole="progressbar"
      accessibilityLabel={title}
    >
      <ActivityIndicator size={compact ? "small" : "large"} color="#2563eb" />
      {title ? (
        <Text
          className={cn(
            "mt-3 text-center font-semibold text-app-text",
            compact ? "text-sm" : "text-base",
          )}
        >
          {title}
        </Text>
      ) : null}
      {subtitle ? (
        <Text className="mt-2 max-w-sm px-2 text-center text-sm leading-5 text-app-text-muted">{subtitle}</Text>
      ) : null}
      {withSkeleton ? (
        <View className="mt-4 w-full">
          <ListSkeleton rows={compact ? 2 : 3} />
        </View>
      ) : null}
    </View>
  );
}
