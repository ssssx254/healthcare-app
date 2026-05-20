import { Button, Card, Input, ScreenScrollView, SectionHeader } from "@/components";
import { LabAttachmentPickerField } from "@/components/LabAttachmentPickerField";
import { labTestsApi } from "@/services/api/labTestsApi";
import type { PickedLabFile } from "@/lib/labFilePick";
import { toFriendlyErrorMn } from "@/lib/friendlyErrorMn";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Text, View } from "react-native";

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function ProviderAddLabTestScreen() {
  const params = useLocalSearchParams<{ patientUserId?: string; clinicId?: string }>();
  const { isOnline } = useNetworkStatus();
  const patientUserId = Number(params.patientUserId);
  const clinicId = Number(params.clinicId);

  const [title, setTitle] = useState("");
  const [testType, setTestType] = useState("");
  const [testDate, setTestDate] = useState(todayIsoDate());
  const [description, setDescription] = useState("");
  const [resultText, setResultText] = useState("");
  const [doctorNotes, setDoctorNotes] = useState("");
  const [resultFile, setResultFile] = useState<PickedLabFile | null>(null);
  const [loading, setLoading] = useState(false);

  const onSave = async () => {
    if (!isOnline) {
      Alert.alert("Офлайн", "Интернет холболтоо шалгаад дахин оролдоно уу.");
      return;
    }
    if (!patientUserId || !clinicId || Number.isNaN(patientUserId) || Number.isNaN(clinicId)) {
      Alert.alert("Алдаа", "Өвчтөн эсвэл эмнэлгийн мэдээлэл дутуу байна.");
      return;
    }
    const t = title.trim();
    const ty = testType.trim();
    if (!t || !ty) {
      Alert.alert("Мэдээлэл дутуу", "Гарчиг болон төрлийг оруулна уу.");
      return;
    }
    setLoading(true);
    try {
      await labTestsApi.createForProvider({
        patient_user_id: patientUserId,
        clinic_id: clinicId,
        title: t,
        test_type: ty,
        test_date: testDate.trim() || todayIsoDate(),
        description: description.trim() || null,
        result_text: resultText.trim() || null,
        doctor_notes: doctorNotes.trim() || null,
        result_file_url: resultFile?.dataUrl ?? null,
        result_file_type: resultFile?.fileType ?? null,
      });
      Alert.alert("Амжилттай", "Шинжилгээний хариу бүртгэгдлээ.");
      router.back();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Хадгалахад алдаа гарлаа.";
      Alert.alert("Алдаа", toFriendlyErrorMn(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: "Хариу нэмэх" }} />
      <ScreenScrollView className="flex-1 bg-app-bg" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <SectionHeader title="Шинжилгээний хариу" subtitle="Үр дүн, тэмдэглэл, файл хавсаргана." />
        {!isOnline ? (
          <Card className="mb-4 border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950">
            <Text className="text-xs text-amber-900 dark:text-amber-100">Офлайн — хадгалах боломжгүй.</Text>
          </Card>
        ) : null}
        <Card>
          <Input label="Гарчиг" value={title} onChangeText={setTitle} placeholder="Шинжилгээний нэр" />
          <Input label="Төрөл" value={testType} onChangeText={setTestType} placeholder="Лаборатори" />
          <Input label="Огноо (YYYY-MM-DD)" value={testDate} onChangeText={setTestDate} />
          <Input label="Тайлбар" value={description} onChangeText={setDescription} multiline />
          <Input label="Шинжилгээний хариу" value={resultText} onChangeText={setResultText} multiline />
          <Input label="Эмчийн тэмдэглэл" value={doctorNotes} onChangeText={setDoctorNotes} multiline />
          <LabAttachmentPickerField
            label="Үр дүнгийн файл"
            valueUrl={resultFile?.dataUrl ?? null}
            valueType={resultFile?.fileType ?? null}
            onChange={setResultFile}
          />
          <Button label="Хадгалах" loading={loading} disabled={!isOnline} onPress={() => void onSave()} />
          <Button label="Буцах" variant="ghost" className="mt-2" onPress={() => router.back()} />
        </Card>
      </ScreenScrollView>
    </>
  );
}
