import { Badge, Button, Card, ErrorState, Input, LoadingState, ScreenScrollView, SectionHeader } from "@/components";
import { LabAttachmentPickerField } from "@/components/LabAttachmentPickerField";
import { labTestStatusLabel, labTestStatusTone } from "@/constants/labTestStatus";
import { labTestsApi, type LabTestRow } from "@/services/api/labTestsApi";
import type { PickedLabFile } from "@/lib/labFilePick";
import { toFriendlyErrorMn } from "@/lib/friendlyErrorMn";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { Stack, router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Text, View } from "react-native";

export default function ProviderLabTestReviewScreen() {
  const { testId } = useLocalSearchParams<{ testId: string }>();
  const { isOnline } = useNetworkStatus();
  const [row, setRow] = useState<LabTestRow | null>(null);
  const [resultText, setResultText] = useState("");
  const [doctorNotes, setDoctorNotes] = useState("");
  const [resultFile, setResultFile] = useState<PickedLabFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!testId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await labTestsApi.getForProvider(testId);
      setRow(data);
      setResultText(data.result_text ?? "");
      setDoctorNotes(data.doctor_notes ?? "");
      if (data.result_file_url) {
        setResultFile({
          dataUrl: data.result_file_url,
          fileType: data.result_file_type === "pdf" ? "pdf" : "image",
        });
      } else {
        setResultFile(null);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Ачааллахад алдаа гарлаа.";
      setError(toFriendlyErrorMn(msg));
      setRow(null);
    } finally {
      setLoading(false);
    }
  }, [testId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const save = async (status?: "completed" | "reviewed") => {
    if (!testId) return;
    if (!isOnline) {
      Alert.alert("Офлайн", "Интернет холболтоо шалгаад дахин оролдоно уу.");
      return;
    }
    setSaving(true);
    try {
      const updated = await labTestsApi.updateForProvider(testId, {
        result_text: resultText.trim() || null,
        doctor_notes: doctorNotes.trim() || null,
        result_file_url: resultFile?.dataUrl ?? null,
        result_file_type: resultFile?.fileType ?? null,
        status,
      });
      setRow(updated);
      Alert.alert("Амжилттай", status === "reviewed" ? "Шалгасан төлөвт шилжлээ." : "Хадгалагдлаа.");
      router.back();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Хадгалахад алдаа гарлаа.";
      Alert.alert("Алдаа", toFriendlyErrorMn(msg));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: "Шинжилгээ шалгах" }} />
      <ScreenScrollView className="flex-1 bg-app-bg" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <SectionHeader title={row?.title ?? "Шинжилгээ"} subtitle="Хариу, тэмдэглэл, файл, төлөв." />

        {!isOnline ? (
          <Card className="mb-4 border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950">
            <Text className="text-xs text-amber-900 dark:text-amber-100">Офлайн — хадгалах боломжгүй.</Text>
          </Card>
        ) : null}

        {error ? (
          <ErrorState className="mb-4" title="Ачаалагдаагүй" message={error} onRetry={() => void load()} retryLabel="Дахин оролдох" />
        ) : null}

        {loading && !row && !error ? (
          <Card className="mb-4">
            <LoadingState compact title="Ачааллаж байна…" />
          </Card>
        ) : null}

        {row ? (
          <Card>
            <View className="flex-row items-center justify-between gap-2">
              <Text className="flex-1 text-sm font-semibold text-app-text">{row.test_type}</Text>
              <Badge label={labTestStatusLabel[row.status]} tone={labTestStatusTone(row.status)} />
            </View>
            <Text className="mt-1 text-xs text-app-text-muted">{row.test_date}</Text>
            {row.description ? (
              <Text className="mt-2 text-xs text-app-text-secondary">{row.description}</Text>
            ) : null}

            <Input
              label="Шинжилгээний хариу"
              value={resultText}
              onChangeText={setResultText}
              placeholder="Үр дүн, тайлбар"
              multiline
              className="mt-4"
            />
            <Input
              label="Эмчийн тэмдэглэл"
              value={doctorNotes}
              onChangeText={setDoctorNotes}
              placeholder="Зөвлөмж, тайлбар"
              multiline
            />
            <LabAttachmentPickerField
              label="Үр дүнгийн файл (PDF / зураг)"
              valueUrl={resultFile?.dataUrl ?? null}
              valueType={resultFile?.fileType ?? null}
              onChange={setResultFile}
            />

            <Button
              label="Хариу хадгалах"
              loading={saving}
              disabled={!isOnline}
              className="mt-2"
              onPress={() => void save("completed")}
            />
            <Button
              label="Шалгасан гэж тэмдэглэх"
              variant="outline"
              loading={saving}
              disabled={!isOnline}
              className="mt-2"
              onPress={() => void save("reviewed")}
            />
          </Card>
        ) : null}

        <Button label="Буцах" variant="ghost" className="mt-4" onPress={() => router.back()} />
      </ScreenScrollView>
    </>
  );
}
