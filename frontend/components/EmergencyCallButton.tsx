import { EmergencyCallConfirmModal } from "@/components/EmergencyCallConfirmModal";
import { AppIcon } from "./AppIcon";
import { cn } from "@/utils/cn";
import { useState } from "react";
import { Pressable, Text, View, type ViewProps } from "react-native";

export type EmergencyCallButtonProps = ViewProps;

/**
 * Нэвтрэхгүйгээр 103 руу яаралтай дуудлага — intro/login/register/forgot-password.
 */
export function EmergencyCallButton({ className, ...rest }: EmergencyCallButtonProps) {
  const [confirmVisible, setConfirmVisible] = useState(false);

  return (
    <View className={cn("w-full", className)} {...rest}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Яаралтай тусламж, 103 дугаар руу залгах"
        onPress={() => setConfirmVisible(true)}
        className="min-h-[48px] flex-row items-center justify-center gap-2 self-stretch rounded-2xl border-2 border-red-700 bg-red-600 px-4 py-3.5 active:bg-red-700 dark:border-red-500 dark:bg-red-700 dark:active:bg-red-800"
      >
        <AppIcon name="phone-alert" size={22} color="#ffffff" />
        <Text className="text-center text-[15px] font-bold leading-5 text-white">Яаралтай тусламж</Text>
      </Pressable>

      <EmergencyCallConfirmModal visible={confirmVisible} onClose={() => setConfirmVisible(false)} />
    </View>
  );
}
