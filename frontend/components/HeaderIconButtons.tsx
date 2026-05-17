import { AppIcon } from "./AppIcon";
import { Link, type Href } from "expo-router";
import { Pressable, useColorScheme, View } from "react-native";

export type HeaderNotificationLinkProps = {
  href: Href;
};

/** Навигацийн толгой — мэдэгдлийн хуудас руу. */
export function HeaderNotificationLink({ href }: HeaderNotificationLinkProps) {
  const scheme = useColorScheme();
  const iconColor = scheme === "dark" ? "#94a3b8" : "#475569";
  return (
    <Link href={href} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Мэдэгдэл нээх"
        hitSlop={12}
        className="ml-1 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl active:opacity-70"
      >
        <AppIcon name="bell-outline" size={24} color={iconColor} />
      </Pressable>
    </Link>
  );
}

export type HeaderChatLinkProps = {
  href: Href;
};

/** Навигацийн толгой — чат руу. */
export function HeaderChatLink({ href }: HeaderChatLinkProps) {
  const scheme = useColorScheme();
  const iconColor = scheme === "dark" ? "#94a3b8" : "#475569";
  return (
    <Link href={href} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Чат нээх"
        hitSlop={12}
        className="ml-1 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl active:opacity-70"
      >
        <AppIcon name="chat-processing-outline" size={24} color={iconColor} />
      </Pressable>
    </Link>
  );
}

export type HeaderLogoutButtonProps = {
  onPress: () => void;
};

/** Навигацийн толгой — гарах. */
export function HeaderLogoutButton({ onPress }: HeaderLogoutButtonProps) {
  const scheme = useColorScheme();
  const iconColor = scheme === "dark" ? "#94a3b8" : "#475569";
  return (
    <View className="mr-1">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Гарах"
        hitSlop={12}
        onPress={onPress}
        className="min-h-[44px] min-w-[44px] items-center justify-center rounded-xl active:opacity-70"
      >
        <AppIcon name="logout" size={22} color={iconColor} />
      </Pressable>
    </View>
  );
}
