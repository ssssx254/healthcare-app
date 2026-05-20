import { cn } from "@/utils/cn";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

type StarRatingProps = {
  value: number;
  max?: number;
  size?: number;
  /** Засварлах боломжтой */
  onChange?: (value: number) => void;
  className?: string;
};

export function StarRating({ value, max = 5, size = 22, onChange, className }: StarRatingProps) {
  const stars = Array.from({ length: max }, (_, i) => i + 1);
  const interactive = Boolean(onChange);

  return (
    <View className={cn("flex-row items-center gap-0.5", className)}>
      {stars.map((star) => {
        const filled = star <= Math.round(value);
        const icon = (
          <MaterialCommunityIcons
            name={filled ? "star" : "star-outline"}
            size={size}
            color={filled ? "#f59e0b" : "#94a3b8"}
          />
        );
        if (!interactive) {
          return <View key={star}>{icon}</View>;
        }
        return (
          <Pressable
            key={star}
            accessibilityRole="button"
            accessibilityLabel={`${star} од`}
            onPress={() => onChange?.(star)}
            hitSlop={6}
            className="p-0.5 active:opacity-70"
          >
            {icon}
          </Pressable>
        );
      })}
    </View>
  );
}
