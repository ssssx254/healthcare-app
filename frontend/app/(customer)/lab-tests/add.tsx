import { Button, Card, Input, ScreenScrollView, SectionHeader } from "@/components";
import { LabAttachmentPickerField } from "@/components/LabAttachmentPickerField";
import { labTestsApi } from "@/services/api/labTestsApi";
import type { PickedLabFile } from "@/lib/labFilePick";
import { toFriendlyErrorMn } from "@/lib/friendlyErrorMn";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { Stack, router } from "expo-router";
import { useState } from "react";
import { Alert, Text, View } from "react-native";

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function AddCustomerLabTestScreen() {
  const { isOnline } = useNetworkStatus();
  const [title, setTitle] = useState("");
  const [testType, setTestType] = useState("");
  const [testDate, setTestDate] = useState(todayIsoDate());
  const [description, setDescription] = useState("");
  const [attachment, setAttachment] = useState<PickedLabFile | null>(null);
  const [loading, setLoading] = useState(false);

  const onSave = async () => {
    if (!isOnline) {
      Alert.alert("Офлайн", "Интернет холболтоо шалгаад дахин оролдоно уу.");
      return;
    }
    const t = title.trim();
    const ty = testType.trim();
    if (!t || !ty) {
      Alert.alert("Мэдээлэл дутуу", "Гарчиг болон шинжилгээний төрлийг оруулна уу.");
      return;
    }
    setLoading(true);
    try {
      const row = await labTestsApi.createMine({
        title: t,
        test_type: ty,
        test_date: testDate.trim() || todayIsoDate(),
        description: description.trim() || null,
        attachment_url: attachment?.dataUrl ?? null,
        attachment_type: attachment?.fileType ?? null,
      });
      router.replace(`/(customer)/lab-tests/${row.id}` as never);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Хадгалахад алдаа гарлаа.";
      Alert.alert("Алдаа", toFriendlyErrorMn(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: "Шинжилгээ нэмэх" }} />
      <ScreenScrollView className="flex-1 bg-app-bg" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <SectionHeader title="Шинжилгээ нэмэх" subtitle="Гарчиг, төрөл, огноо, тайлбар, файл хавсаргана." />
        {!isOnline ? (
          <Card className="mb-4 border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950">
            <Text className="text-xs text-amber-900 dark:text-amber-100">
              Офлайн горимд байна. Хадгалахын тулд интернет холболт хэрэгтэй.
            </Text>
          </Card>
        ) : null}
        <Card>
          <Input label="Гарчиг" value={title} onChangeText={setTitle} placeholder="Жишээ: Цусны ерөнхий шинжилгээ" />
          <Input label="Шинжилгээний төрөл" value={testType} onChangeText={setTestType} placeholder="Жишээ: Лаборатори" />
          <Input label="Огноо (YYYY-MM-DD)" value={testDate} onChangeText={setTestDate} placeholder="2026-05-20" />
          <Input
            label="Тайлбар"
            value={description}
            onChangeText={setDescription}
            placeholder="Нэмэлт мэдээлэл (заавал биш)"
            multiline
          />
          <LabAttachmentPickerField
            label="Хавсаргасан файл"
            hint="Зураг эсвэл PDF (заавал биш)"
            valueUrl={attachment?.dataUrl ?? null}
            valueType={attachment?.fileType ?? null}
            onChange={setAttachment}
          />
          <Button label="Хадгалах" loading={loading} disabled={!isOnline} onPress={() => void onSave()} />
          <Button label="Буцах" variant="ghost" className="mt-2" onPress={() => router.back()} />
        </Card>
      </ScreenScrollView>
    </>
  );
}
