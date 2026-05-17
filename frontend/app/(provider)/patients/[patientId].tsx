import { Badge, Card, ScreenScrollView, SectionHeader } from "@/components";
import { providerBookingStatusLabel, type ProviderBookingStatus } from "@/constants/providerBookingStatus";
import { listProviderPatientNotesByPatient } from "@/data/healthcare/providerNotesStore";
import { useProviderWorkspace } from "@/contexts/ProviderWorkspaceContext";
import { Stack, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

export default function ProviderPatientDetailScreen() {
  const { patientId } = useLocalSearchParams<{ patientId: string }>();
  const { bookings } = useProviderWorkspace();
  const patientName = patientId?.trim() || "Үйлчлүүлэгч";

  const history = bookings
    .filter((b) => (b.patientName ?? "Үйлчлүүлэгч") === patientName)
    .sort((a, b) => b.createdAtIso.localeCompare(a.createdAtIso));
  const notes = listProviderPatientNotesByPatient(patientName);

  return (
    <>
      <Stack.Screen options={{ title: "Өвчтөний дэлгэрэнгүй" }} />
      <ScreenScrollView className="flex-1 bg-slate-50 dark:bg-slate-950" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <SectionHeader title={patientName} subtitle="Үзлэгийн түүх, тэмдэглэл, жор (сонголттой)." />

        <Card className="mb-3">
          <Text className="text-sm font-semibold text-slate-900 dark:text-slate-50">Үзлэгийн түүх</Text>
          {history.length === 0 ? (
            <Text className="mt-2 text-xs text-slate-500 dark:text-slate-400">Үзлэгийн түүх алга.</Text>
          ) : (
            <View className="mt-2 gap-2">
              {history.map((h) => (
                <View key={h.id} className="rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/80">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm font-medium text-slate-900 dark:text-slate-50">{h.serviceTitle}</Text>
                    <Badge
                      label={
                        providerBookingStatusLabel[h.providerStatus as ProviderBookingStatus] ?? h.providerStatus
                      }
                      tone="neutral"
                    />
                  </View>
                  <Text className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Огноо: {h.date ?? h.createdAtIso.slice(0, 10)} · Цаг: {h.time ?? "—"}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </Card>

        <Card className="mb-3">
          <Text className="text-sm font-semibold text-slate-900 dark:text-slate-50">Эмчийн тэмдэглэл</Text>
          {notes.length === 0 ? (
            <Text className="mt-2 text-xs text-slate-500 dark:text-slate-400">Одоогоор тэмдэглэл бүртгэгдээгүй байна.</Text>
          ) : (
            <View className="mt-2 gap-2">
              {notes.map((n) => (
                <View key={n.id} className="rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/80">
                  <Text className="text-xs text-slate-600 dark:text-slate-300">Онош: {n.diagnosis}</Text>
                  <Text className="mt-1 text-xs text-slate-600 dark:text-slate-300">Зөвлөгөө: {n.advice}</Text>
                  <Text className="mt-1 text-xs text-slate-600 dark:text-slate-300">Эмчилгээ: {n.treatment}</Text>
                </View>
              ))}
            </View>
          )}
        </Card>

        <Card>
          <Text className="text-sm font-semibold text-slate-900 dark:text-slate-50">Жор (сонголттой)</Text>
          <Text className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Одоогоор эмийн жорын хэсэг холбогдоогүй. Дараагийн хувилбарт эм, тун, зааврыг оруулах боломж нэмэгдэнэ.
          </Text>
        </Card>
      </ScreenScrollView>
    </>
  );
}

