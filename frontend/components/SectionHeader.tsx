import { isWeb } from "@/constants/webLayout";
import { cn } from "@/utils/cn";
import type { ReactNode } from "react";
import { Text, View, type ViewProps } from "react-native";

export type SectionHeaderProps = ViewProps & {
  title: string;
  subtitle?: string;
  /** Subtitle-д нэмэх class (жишээ нь `mt-1.5` — гарчигтой ойртуулах). */
  subtitleClassName?: string;
  action?: ReactNode;
  /** `hero` — дэлгэцийн гол гарчиг (том); `default` — хэсгийн гарчиг. */
  variant?: "default" | "hero";
};

export function SectionHeader({
  title,
  subtitle,
  subtitleClassName,
  action,
  variant = "default",
  className,
  ...rest
}: SectionHeaderProps) {
  const titleClass =
    variant === "hero"
      ? cn(
          "font-bold tracking-tight text-slate-900 dark:text-slate-50",
          isWeb ? "text-xl" : "text-2xl",
        )
      : "text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50";

  return (
    <View className={cn("mb-4 flex-row items-start justify-between gap-3", className)} {...rest}>
      <View className="min-w-0 flex-1 pr-1">
        <Text className={cn(titleClass)}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            className={cn(
              "text-sm font-normal leading-5 text-slate-600 dark:text-slate-300",
              subtitleClassName ?? "mt-1.5",
            )}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {action ? <View className="shrink-0 self-center">{action}</View> : null}
    </View>
  );
}
