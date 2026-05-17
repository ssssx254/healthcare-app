import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function OfflineBanner() {
  const { isOnline, cacheServedAt } = useNetworkStatus();
  const insets = useSafeAreaInsets();
  if (isOnline) return null;

  return (
    <View
      pointerEvents="none"
      style={{ paddingTop: insets.top + 6 }}
      className="absolute left-0 right-0 top-0 z-50 bg-amber-500/95 px-4 pb-3"
    >
      <Text className="text-center text-sm font-bold text-white">Интернет холболтгүй байна</Text>
      {cacheServedAt ? <Text className="mt-1 text-center text-xs text-white/90">Сүүлд татсан мэдээлэл</Text> : null}
    </View>
  );
}
