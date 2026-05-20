import { AppIcon } from "./AppIcon";
import { openEmergencyCall } from "@/lib/emergencyCall";
import { Modal, Pressable, Text, View } from "react-native";

export type EmergencyCallConfirmModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function EmergencyCallConfirmModal({ visible, onClose }: EmergencyCallConfirmModalProps) {
  const onConfirm = () => {
    onClose();
    void openEmergencyCall();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        className="flex-1 items-center justify-center bg-black/50 px-6"
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Цонх хаах"
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="w-full max-w-sm rounded-3xl border border-app-border bg-app-card p-6"
          style={{
            shadowColor: "#020617",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 16,
            elevation: 8,
          }}
          accessibilityViewIsModal
        >
          <View className="mb-3 items-center">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-950">
              <AppIcon name="phone" size={28} color="#dc2626" />
            </View>
          </View>
          <Text className="text-center text-lg font-bold text-app-text">
            Яаралтай тусламж дуудах уу?
          </Text>
          <Text className="mt-3 text-center text-sm leading-6 text-app-text-secondary">
            103 дугаар руу залгах гэж байна.
          </Text>
          <View className="mt-6 flex-row gap-3">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Болих"
              onPress={onClose}
              className="min-h-[48px] flex-1 items-center justify-center rounded-2xl border-2 border-app-border-strong bg-app-muted px-3 py-3 active:opacity-90"
            >
              <Text className="text-center text-[15px] font-semibold text-app-text">
                Болих
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="103 руу залгах"
              onPress={onConfirm}
              className="min-h-[48px] flex-1 items-center justify-center rounded-2xl border-2 border-red-700 bg-red-600 px-3 py-3 active:bg-red-700 dark:border-red-500 dark:bg-red-700"
            >
              <Text className="text-center text-[15px] font-bold text-white">Залгах</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
