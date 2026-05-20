import { Card, EmptyState, ScreenScrollView, SectionHeader } from "@/components";
import { listProviderPatientNotes } from "@/data/healthcare/providerNotesStore";
import { Stack, useRouter } from "expo-router";
import { Text, View } from "react-native";

export default function DoctorNotesScreen() {
  const router = useRouter();
  const notes = listProviderPatientNotes();
  const hasNotes = notes.length > 0;

  return (
    <>
      <Stack.Screen options={{ title: "Эмчийн тэмдэглэл" }} />
      <ScreenScrollView className="flex-1 bg-app-bg" contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
        <SectionHeader title="Эмчийн тэмдэглэл" subtitle="Үзлэгийн дараах зөвлөгөө, тэмдэглэл энд харагдана." />

        {!hasNotes ? (
          <Card>
            <EmptyState
              title="Тэмдэглэл алга"
              description="Одоогоор эмчийн тэмдэглэл бүртгэгдээгүй байна."
              action={{ label: "Цаг захиалах", onPress: () => router.push("/(customer)/appointments"), variant: "outline" }}
            />
          </Card>
        ) : (
          <View className="gap-3">
            {notes.map((n) => (
              <Card key={n.id}>
                <Text className="text-sm font-semibold text-app-text">{n.patientName ?? "Үйлчлүүлэгч"} — Эмчийн тэмдэглэл</Text>
                <Text className="mt-1 text-xs text-app-text-muted">{n.doctorName ?? "Эмч"} · {new Date(n.createdAtIso).toLocaleDateString("mn-MN")}</Text>
                <Text className="mt-2 text-xs leading-5 text-app-text-secondary">Онош: {n.diagnosis}</Text>
                <Text className="mt-1 text-xs leading-5 text-app-text-secondary">Зөвлөгөө: {n.advice}</Text>
                <Text className="mt-1 text-xs leading-5 text-app-text-secondary">Эмчилгээ: {n.treatment}</Text>
              </Card>
            ))}
          </View>
        )}
      </ScreenScrollView>
    </>
  );
}

