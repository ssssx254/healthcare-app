import { EmergencyCallConfirmModal } from "@/components/EmergencyCallConfirmModal";
import { AppIcon } from "./AppIcon";
import { Link, type Href } from "expo-router";
import { useState } from "react";
import { useAppTheme } from "@/components/ThemeProvider";
import { Pressable, View } from "react-native";

const HEADER_ICON_SIZE = 24;
const EMERGENCY_ICON_COLOR = "#dc2626";

export type HeaderNotificationLinkProps = {
  href: Href;
};

/** Навигацийн толгой — мэдэгдлийн хуудас руу. */
export function HeaderNotificationLink({ href }: HeaderNotificationLinkProps) {
  const { palette } = useAppTheme();
  return (
    <Link href={href} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Мэдэгдэл нээх"
        hitSlop={12}
        className="ml-1 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl active:opacity-70"
      >
        <AppIcon name="bell-outline" size={HEADER_ICON_SIZE} color={palette.icon} />
      </Pressable>
    </Link>
  );
}

export type HeaderChatLinkProps = {
  href: Href;
};

/** Навигацийн толгой — чат руу. */
export function HeaderChatLink({ href }: HeaderChatLinkProps) {
  const { palette } = useAppTheme();
  return (
    <Link href={href} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Чат нээх"
        hitSlop={12}
        className="ml-1 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl active:opacity-70"
      >
        <AppIcon name="chat-processing-outline" size={HEADER_ICON_SIZE} color={palette.icon} />
      </Pressable>
    </Link>
  );
}

/** Үйлчлүүлэгчийн толгой — чатын хажууд улаан утасны icon (103). */
export function HeaderEmergencyCallButton() {
  const [confirmVisible, setConfirmVisible] = useState(false);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Яаралтай тусламж, 103 руу залгах"
        hitSlop={12}
        onPress={() => setConfirmVisible(true)}
        className="ml-1 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl active:opacity-70"
      >
        <AppIcon name="phone" size={HEADER_ICON_SIZE} color={EMERGENCY_ICON_COLOR} />
      </Pressable>
      <EmergencyCallConfirmModal visible={confirmVisible} onClose={() => setConfirmVisible(false)} />
    </>
  );
}

export type HeaderThemeToggleButtonProps = {
  /** Splash зэрэг бараан дэвсгэр дээр */
  variant?: "default" | "onDark";
};

/** Навигацийн толгой — дэлгэцийн горим солих (icon). */
export function HeaderThemeToggleButton({ variant = "default" }: HeaderThemeToggleButtonProps) {
  const { theme, toggleTheme, palette } = useAppTheme();
  const isDark = theme === "dark";
  const iconName = isDark ? "white-balance-sunny" : "weather-night";
  const iconColor = variant === "onDark" ? "#f8fafc" : palette.icon;
  const label = isDark ? "Цайвар горим рүү шилжих" : "Харанхуй горим рүү шилжих";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Дэлгэцийн өнгийг солино"
      hitSlop={12}
      onPress={toggleTheme}
      className="ml-1 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl active:opacity-70"
    >
      <AppIcon name={iconName} size={HEADER_ICON_SIZE} color={iconColor} />
    </Pressable>
  );
}

export type HeaderLogoutButtonProps = {
  onPress: () => void;
};

/** Навигацийн толгой — гарах. */
export function HeaderLogoutButton({ onPress }: HeaderLogoutButtonProps) {
  const { palette } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Гарах"
      hitSlop={12}
      onPress={onPress}
      className="min-h-[44px] min-w-[44px] items-center justify-center rounded-xl active:opacity-70"
    >
      <AppIcon name="logout" size={22} color={palette.icon} />
    </Pressable>
  );
}

/** Толгой баруун — горим + гарах (logout-ийн зүүн талд). */
export function HeaderThemeAndLogout({ onPress }: HeaderLogoutButtonProps) {
  return (
    <View className="mr-1 flex-row items-center">
      <HeaderThemeToggleButton />
      <HeaderLogoutButton onPress={onPress} />
    </View>
  );
}
