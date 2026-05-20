import { Button } from "@/components/Button";
import { AppImage } from "@/components/AppImage";
import { pickLabImageDataUrl, pickLabPdfDataUrl, type PickedLabFile } from "@/lib/labFilePick";
import { useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";

export type LabAttachmentPickerFieldProps = {
  label: string;
  hint?: string;
  valueUrl: string | null;
  valueType: "image" | "pdf" | null;
  onChange: (file: PickedLabFile | null) => void;
};

export function LabAttachmentPickerField({
  label,
  hint,
  valueUrl,
  valueType,
  onChange,
}: LabAttachmentPickerFieldProps) {
  const [busy, setBusy] = useState(false);
  const hasFile = Boolean(valueUrl?.trim());

  const pickImage = async () => {
    setBusy(true);
    try {
      const picked = await pickLabImageDataUrl();
      if (picked) onChange(picked);
    } finally {
      setBusy(false);
    }
  };

  const pickPdf = async () => {
    setBusy(true);
    try {
      const picked = await pickLabPdfDataUrl();
      if (picked) onChange(picked);
    } finally {
      setBusy(false);
    }
  };

  const openFile = () => {
    const u = valueUrl?.trim();
    if (!u) return;
    if (u.startsWith("http")) void Linking.openURL(u);
  };

  return (
    <View className="mb-4">
      <Text className="mb-1 text-sm font-medium text-app-text">{label}</Text>
      {hint ? <Text className="mb-2 text-xs text-app-text-muted">{hint}</Text> : null}
      {hasFile && valueType === "image" ? (
        <AppImage
          source={{ uri: valueUrl! }}
          fallbackIcon="file-image-outline"
          className="mb-3 h-32 w-full max-w-xs rounded-xl border border-app-border"
          accessibilityLabel="Хавсаргасан зураг"
        />
      ) : null}
      {hasFile && valueType === "pdf" ? (
        <Pressable onPress={openFile} className="mb-3 rounded-xl border border-app-border bg-app-muted/80 px-3 py-3">
          <Text className="text-sm font-medium text-app-text">PDF хавсаргасан</Text>
          <Text className="mt-1 text-xs text-app-text-muted">Товшвол нээх боломжтой (холбоос байвал)</Text>
        </Pressable>
      ) : null}
      {!hasFile ? (
        <View className="mb-3 rounded-xl border border-dashed border-app-border-strong bg-app-card/60 px-3 py-4">
          <Text className="text-center text-xs text-app-text-muted">Файл сонгоогүй</Text>
        </View>
      ) : null}
      <View className="flex-row flex-wrap gap-2">
        <Button label={busy ? "…" : "Зураг"} onPress={() => void pickImage()} disabled={busy} variant="outline" className="min-w-[100px]" />
        <Button label={busy ? "…" : "PDF"} onPress={() => void pickPdf()} disabled={busy} variant="outline" className="min-w-[100px]" />
        {hasFile ? (
          <Button label="Хасах" variant="ghost" onPress={() => onChange(null)} disabled={busy} className="min-w-[80px]" />
        ) : null}
      </View>
    </View>
  );
}
