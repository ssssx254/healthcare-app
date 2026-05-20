import { cn } from "@/utils/cn";
import { View, type ViewProps } from "react-native";

export type CardProps = ViewProps & {
  padded?: boolean;
};

export function Card({ padded = true, className, children, ...rest }: CardProps) {
  return (
    <View
      className={cn(
        "max-w-full overflow-hidden rounded-3xl border border-app-border bg-app-card shadow-md",
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
