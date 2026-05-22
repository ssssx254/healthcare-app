import { buildQrMatrix } from "@/lib/qrCodeMatrix";
import { useMemo } from "react";
import { Text, View } from "react-native";

export type QpayQrCodeProps = {
  /** QPay / нэхэмжлэлийн QR агуулга */
  value: string;
  size?: number;
  className?: string;
};

function QrMatrixView({ matrix, size }: { matrix: NonNullable<ReturnType<typeof buildQrMatrix>>; size: number }) {
  const { moduleCount, isDark } = matrix;
  const cell = size / moduleCount;
  const quiet = Math.max(2, Math.floor(cell * 0.5));
  const canvas = size + quiet * 2;

  return (
    <View
      style={{
        width: canvas,
        height: canvas,
        padding: quiet,
        backgroundColor: "#ffffff",
        borderRadius: 8,
      }}
    >
      <View style={{ width: size, height: size }}>
        {Array.from({ length: moduleCount }, (_, row) => (
          <View key={`r-${row}`} style={{ flexDirection: "row", height: cell }}>
            {Array.from({ length: moduleCount }, (_, col) => (
              <View
                key={`c-${col}`}
                style={{
                  width: cell,
                  height: cell,
                  backgroundColor: isDark(row, col) ? "#0f172a" : "#ffffff",
                }}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * Нэхэмжлэлийн `qr_payload`-аас уншигдах QR (RN-д canvas шаарддаггүй).
 */
export function QpayQrCode({ value, size = 220, className }: QpayQrCodeProps) {
  const payload = value?.trim() ?? "";
  const matrix = useMemo(() => (payload ? buildQrMatrix(payload) : null), [payload]);

  if (!payload) {
    return (
      <View className={`items-center rounded-2xl border border-dashed border-app-border bg-app-muted p-6 ${className ?? ""}`}>
        <Text className="text-sm text-app-text-muted">QR өгөгдөл байхгүй</Text>
      </View>
    );
  }

  if (!matrix) {
    return (
      <View className={`items-center rounded-2xl border border-rose-200 bg-rose-50 p-6 dark:border-rose-900/50 dark:bg-rose-950/40 ${className ?? ""}`}>
        <Text className="text-sm text-rose-800 dark:text-rose-200">QR зураг үүсгэхэд алдаа гарлаа</Text>
      </View>
    );
  }

  return (
    <View className={`items-center ${className ?? ""}`}>
      <View className="rounded-2xl bg-white p-3 shadow-sm">
        <QrMatrixView matrix={matrix} size={size} />
      </View>
      <Text className="mt-3 text-center text-xs text-app-text-muted">Банкны апп-аар QR уншуулна уу</Text>
    </View>
  );
}
