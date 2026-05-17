import { cn } from "@/utils/cn";
import { View, type ViewProps } from "react-native";

export type CardProps = ViewProps & {
  padded?: boolean;
};

export function Card({ padded = true, className, children, ...rest }: CardProps) {
  return (
    <View
      className={cn(
        "max-w-full overflow-hidden rounded-3xl border border-slate-200/95 bg-white shadow-md dark:border-slate-700/80 dark:bg-slate-900/95",
        "shadow-black/10 dark:shadow-black/25",
        padded && "p-4",
        className,
      )}
      {...rest}
    >
      {children}
    </View>
  );
}
