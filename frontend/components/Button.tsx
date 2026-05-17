import { cn } from "@/utils/cn";
import { ActivityIndicator, Pressable, Text, View, type PressableProps } from "react-native";

type Variant = "primary" | "secondary" | "outline" | "ghost";

export type ButtonProps = PressableProps & {
  label: string;
  variant?: Variant;
  loading?: boolean;
};

const variantClasses: Record<Variant, { base: string; text: string }> = {
  primary: {
    base: "bg-brand-600 active:bg-brand-700",
    text: "text-white font-semibold",
  },
  secondary: {
    base: "bg-slate-200 active:bg-slate-300 dark:bg-slate-700 dark:active:bg-slate-600",
    text: "text-slate-900 dark:text-slate-50 font-semibold",
  },
  outline: {
    base: "border-2 border-brand-600 bg-transparent active:bg-brand-50 dark:active:bg-brand-900",
    text: "text-brand-700 dark:text-brand-300 font-semibold",
  },
  ghost: {
    base: "bg-transparent active:bg-slate-100 dark:active:bg-slate-800/80",
    text: "text-brand-700 dark:text-brand-300 font-medium",
  },
};

export function Button({
  label,
  variant = "primary",
  loading,
  disabled,
  className,
  ...rest
}: ButtonProps) {
  const v = variantClasses[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: Boolean(loading) }}
      accessibilityLabel={loading ? `${label}, уншиж байна` : undefined}
      disabled={isDisabled}
      className={cn(
        "min-h-[48px] min-w-[44px] max-w-full flex-row items-center justify-center self-stretch rounded-2xl px-4 py-3.5 active:opacity-90",
        v.base,
        isDisabled && "opacity-45",
        className,
      )}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#fff" : "#2563EB"} />
      ) : (
        <View className="w-full min-w-0 px-0.5">
          <Text
            className={cn("text-center text-[15px] leading-5", v.text)}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
