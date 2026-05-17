import { cn } from "@/utils/cn";
import { Text, View } from "react-native";
import { AppIcon } from "./AppIcon";
import { Button } from "./Button";
import { Card } from "./Card";

export type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void | Promise<void>;
  retryLabel?: string;
  className?: string;
};

export function ErrorState({
  title = "Алдаа гарлаа",
  message,
  onRetry,
  retryLabel = "Дахин оролдох",
  className,
}: ErrorStateProps) {
  return (
    <Card className={cn("border-red-200 bg-red-50/90 dark:border-red-900/50 dark:bg-red-950/35", className)}>
      <View className="items-center px-1">
        <View className="mb-1 h-12 w-12 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/50">
          <AppIcon name="alert-circle-outline" size={28} color="#b91c1c" />
        </View>
        <Text className="mt-2 text-center text-base font-semibold text-red-900 dark:text-red-100">{title}</Text>
        <Text className="mt-2 text-center text-sm leading-5 text-red-800 dark:text-red-200/95">{message}</Text>
        {onRetry ? (
          <View className="mt-5 w-full max-w-xs">
            <Button label={retryLabel} variant="outline" onPress={() => void onRetry()} />
          </View>
        ) : null}
      </View>
    </Card>
  );
}
