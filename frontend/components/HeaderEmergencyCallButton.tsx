import { EmergencyCallModal } from "@/components/EmergencyCallModal";
import { AppIcon } from "./AppIcon";
import { useState } from "react";
import { Pressable } from "react-native";

const EMERGENCY_ICON_COLOR = "#dc2626";

/** Үйлчлүүлэгчийн толгой — чатын хажууд, бусад header icon-той ижил хэмжээ, улаан утасны icon. */
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
        <AppIcon name="phone" size={24} color={EMERGENCY_ICON_COLOR} />
      </Pressable>

      <EmergencyCallModal visible={confirmVisible} onClose={() => setConfirmVisible(false)} />
    </>
  );
}
