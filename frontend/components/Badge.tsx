import { cn } from "@/utils/cn";
import { Text, View, type ViewProps } from "react-native";

type Tone = "brand" | "neutral" | "success" | "warning";

export type BadgeProps = ViewProps & {
  label: string;
  tone?: Tone;
};

const toneClasses: Record<Tone, string> = {
  brand: "bg-brand-100 dark:bg-brand-900/80",
  neutral: "bg-slate-100 dark:bg-slate-800",
  success: "bg-emerald-100 dark:bg-emerald-900/50",
  warning: "bg-amber-100 dark:bg-amber-900/50",
};

const textTone: Record<Tone, string> = {
  brand: "text-brand-800 dark:text-brand-100",
  neutral: "text-slate-700 dark:text-slate-200",
  success: "text-emerald-900 dark:text-emerald-100",
  warning: "text-amber-900 dark:text-amber-100",
};

export function Badge({ label, tone = "brand", className, ...rest }: BadgeProps) {
  return (
    <View
      className={cn("max-w-[88%] shrink-0 self-start rounded-full px-2.5 py-1.5", toneClasses[tone], className)}
      {...rest}
    >
      <Text className={cn("text-center text-[11px] font-semibold leading-4", textTone[tone])} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}
