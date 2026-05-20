import { Button } from "@/components/Button";
import { pickDoctorProfileImageFromLibrary } from "@/lib/doctorImagePick";
import { copyPickedDoctorImageToPersistentFile } from "@/lib/doctorPhotoFile";
import { removeDoctorPhotoOverride, setDoctorPhotoOverride } from "@/data/healthcare/doctorPhotoOverridesStore";
import { useState } from "react";
import { Platform, Text, View } from "react-native";
import { AppImage } from "./AppImage";

export type DoctorPhotoPickerFieldProps = {
  /** Харагдах нэр — урьдчилан харахад fallback avatar-д */
  nameForFallback: string;
  doctorId?: string | null;
  /** Галерей + вэб холбоосын нэгтгэсэн урьдчилан харагдах URI */
  previewUri: string | null;
  /** Галерейгаас сонгосон эцсийн URI (тогтмол файл эсвэл түр холбоос) */
  onPicked: (uri: string) => void | Promise<void>;
  /** Зураг хасах: эмчийн ID байвал түр зам устгана; register-д galleryUri цэвэрлэнэ */
  showClearButton: boolean;
  onClear: () => void | Promise<void>;
};

export function DoctorPhotoPickerField({
  nameForFallback,
  doctorId,
  previewUri,
  onPicked,
  showClearButton,
  onClear,
}: DoctorPhotoPickerFieldProps) {
  const [busy, setBusy] = useState(false);
  const hasPreview = Boolean(previewUri?.trim());

  const pick = async () => {
    setBusy(true);
    try {
      const picked = await pickDoctorProfileImageFromLibrary();
      if (!picked) return;
      if (doctorId && Platform.OS !== "web") {
        const persistent = await copyPickedDoctorImageToPersistentFile(picked, doctorId);
        await setDoctorPhotoOverride(doctorId, persistent);
        await onPicked(persistent);
      } else {
        await onPicked(picked);
      }
    } finally {
      setBusy(false);
    }
  };

  const clear = async () => {
    if (doctorId) await removeDoctorPhotoOverride(doctorId);
    await onClear();
  };

  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-medium text-app-text">Профайл зураг</Text>
      {hasPreview ? (
        <AppImage
          source={{ uri: previewUri!.trim() }}
          fallbackIcon="account-circle-outline"
          className="mb-3 h-28 w-28 rounded-2xl border border-app-border"
          accessibilityLabel="Эмчийн зургийн урьдчилан харагдац"
        />
      ) : (
        <View className="mb-3 h-28 w-28 items-center justify-center rounded-2xl border border-dashed border-slate-300 border-app-border-strong bg-app-card/60">
          <Text className="px-2 text-center text-xs text-app-text-muted">Зураг сонгоогүй байна</Text>
          {nameForFallback.trim() ? (
            <Text className="mt-1 px-2 text-center text-[10px] text-app-text-muted" numberOfLines={1}>
              {nameForFallback.trim()}
            </Text>
          ) : null}
        </View>
      )}
      <Text className="mb-2 text-xs text-app-text-muted">
        Галерейгаас сонгоно. Хадгалахаас өмнө урьдчилан харагдана.
      </Text>
      <View className="flex-row flex-wrap gap-2">
        <Button label={busy ? "Уншиж байна…" : "Зураг сонгох"} onPress={() => void pick()} disabled={busy} className="min-w-[140px]" />
        {showClearButton ? (
          <Button label="Зураг хасах" variant="outline" onPress={() => void clear()} disabled={busy} className="min-w-[120px]" />
        ) : null}
      </View>
    </View>
  );
}
