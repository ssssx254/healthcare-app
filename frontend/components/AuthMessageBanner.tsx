import { cn } from "@/utils/cn";
import { Text, View, type ViewProps } from "react-native";
import { AppIcon } from "./AppIcon";

export type AuthMessageBannerProps = ViewProps & {
  message: string;
  variant: "error" | "success" | "info";
};

const config = {
  error: {
    box: "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/50",
    text: "text-red-800 dark:text-red-200",
    icon: "alert-circle-outline" as const,
    iconColor: "#b91c1c",
  },
  success: {
    box: "border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/40",
    text: "text-emerald-900 dark:text-emerald-100",
    icon: "check-circle-outline" as const,
    iconColor: "#047857",
  },
  info: {
    box: "border-slate-200 bg-slate-100 dark:border-slate-600 dark:bg-slate-800/80",
    text: "text-slate-700 dark:text-slate-200",
    icon: "information-outline" as const,
    iconColor: "#475569",
  },
};

export function AuthMessageBanner({ message, variant, className, ...rest }: AuthMessageBannerProps) {
  const c = config[variant];
  return (
    <View
      className={cn("flex-row gap-3 rounded-2xl border px-4 py-3.5", c.box, className)}
      accessibilityRole="alert"
      {...rest}
    >
      <AppIcon name={c.icon} size={22} color={c.iconColor} style={{ marginTop: 1 }} />
      <Text className={cn("min-w-0 flex-1 text-sm leading-5", c.text)}>{message}</Text>
    </View>
  );
}
