import { cn } from "@/utils/cn";
import { Text, View } from "react-native";
import { Card } from "./Card";

export type StatCardProps = {
  title: string;
  value: string;
  hint?: string;
  className?: string;
};

export function StatCard({ title, value, hint, className }: StatCardProps) {
  return (
    <Card className={cn("min-w-0 flex-1 justify-between", className)}>
      <Text
        className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
        numberOfLines={2}
      >
        {title}
      </Text>
      <Text
        className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-slate-50"
        numberOfLines={2}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
      >
        {value}
      </Text>
      {hint ? (
        <Text className="mt-1.5 text-[11px] leading-4 text-slate-500 dark:text-slate-400" numberOfLines={2}>
          {hint}
        </Text>
      ) : null}
    </Card>
  );
}
