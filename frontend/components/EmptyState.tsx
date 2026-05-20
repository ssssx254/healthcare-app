import { AppIcon } from "./AppIcon";
import type { AppIconProps } from "./AppIcon";
import { Text, View } from "react-native";
import { Button, type ButtonProps } from "./Button";

export type EmptyStateProps = {
  title: string;
  description: string;
  action?: Pick<ButtonProps, "label" | "onPress" | "variant">;
  /** MaterialCommunityIcons нэр — хоосон бол clipboard-text-outline */
  icon?: AppIconProps["name"];
};

export function EmptyState({ title, description, action, icon = "clipboard-text-outline" }: EmptyStateProps) {
  return (
    <View className="w-full max-w-full items-center justify-center px-3 py-8">
      <View className="mb-3 h-14 w-14 items-center justify-center rounded-2xl bg-app-muted">
        <AppIcon name={icon} size={30} color="#64748b" />
      </View>
      <Text className="text-center text-lg font-bold leading-6 text-app-text">
        {title}
      </Text>
      <Text className="mt-2 max-w-sm text-center text-sm leading-5 text-app-text-secondary">
        {description}
      </Text>
      {action ? (
        <View className="mt-6 w-full max-w-xs">
          <Button label={action.label} onPress={action.onPress} variant={action.variant ?? "primary"} />
        </View>
      ) : null}
    </View>
  );
}
