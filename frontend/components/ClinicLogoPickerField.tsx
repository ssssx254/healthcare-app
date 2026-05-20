import { Button } from "./Button";
import { pickClinicLogoDataUrlFromLibrary } from "@/lib/clinicLogoPick";
import { useState } from "react";
import { Text, View } from "react-native";
import { AppImage } from "./AppImage";

export type ClinicLogoPickerFieldProps = {
  value: string | null;
  onChange: (next: string | null) => void;
};

export function ClinicLogoPickerField({ value, onChange }: ClinicLogoPickerFieldProps) {
  const [busy, setBusy] = useState(false);
  const hasLogo = Boolean(value?.trim());

  const pick = async () => {
    setBusy(true);
    try {
      const dataUrl = await pickClinicLogoDataUrlFromLibrary();
      if (dataUrl) onChange(dataUrl);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-medium text-app-text">Эмнэлгийн лого (заавал биш)</Text>
      {hasLogo ? (
        <AppImage
          source={{ uri: value!.trim() }}
          fallbackIcon="hospital-building"
          className="mb-3 h-28 w-28 rounded-2xl border border-app-border"
          accessibilityLabel="Эмнэлгийн логоны урьдчилан харагдац"
        />
      ) : (
        <View className="mb-3 h-28 w-28 items-center justify-center rounded-2xl border border-dashed border-slate-300 border-app-border-strong bg-app-card/60">
          <Text className="px-2 text-center text-xs text-app-text-muted">Лого сонгоогүй</Text>
        </View>
      )}
      <Text className="mb-2 text-xs text-app-text-muted">
        Утасны зурагны сангаас сонгоно. Илгээхийн өмнө энд харагдана.
      </Text>
      <View className="flex-row flex-wrap gap-2">
        <Button label={busy ? "Уншиж байна…" : "Зураг сонгох"} onPress={() => void pick()} disabled={busy} className="min-w-[140px]" />
        {hasLogo ? (
          <Button label="Лого хасах" variant="outline" onPress={() => onChange(null)} disabled={busy} className="min-w-[120px]" />
        ) : null}
      </View>
    </View>
  );
}
