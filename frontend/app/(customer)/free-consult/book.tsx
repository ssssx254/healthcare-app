import { AuthMessageBanner, Button, Card, FormScrollView, Input, SectionHeader } from "@/components";
import { getConsultationStatusLabel } from "@/constants/consultationStatus";
import { useCustomerBooking } from "@/contexts/CustomerBookingContext";
import { ApiError } from "@/lib/api/client";
import { consultationApi, type FreeConsultSlotOption } from "@/services/api/consultationApi";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

export default function FreeConsultBookScreen() {
  const { doctorId, clinicId, doctorName, clinicName } = useLocalSearchParams<{
    doctorId: string;
    clinicId: string;
    doctorName: string;
    clinicName: string;
  }>();
  const { addFreeConsultOrder } = useCustomerBooking();
  const [slots, setSlots] = useState<FreeConsultSlotOption[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [symptoms, setSymptoms] = useState("");
  const [question, setQuestion] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSlots = useCallback(async () => {
    if (!doctorId || !clinicId) return;
    setSlotsLoading(true);
    try {
      const data = await consultationApi.listFreeAvailability();
      const doc = data.items.find((d) => String(d.doctor_id) === String(doctorId));
      setSlots(doc?.slots ?? []);
      if (doc?.slots[0]) setSelectedSlotId(doc.slots[0].id);
    } catch {
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [doctorId, clinicId]);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  const onSubmit = async () => {
    if (!doctorId || !clinicId || !selectedSlotId) {
      setError("Цаг сонгоно уу.");
      return;
    }
    if (!symptoms.trim() || !question.trim()) {
      setError("Биеийн байдал болон асуух зүйлийг бөглөнө үү.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await addFreeConsultOrder({
        clinicId,
        clinicName: clinicName ?? "",
        doctorId,
        doctorName: doctorName ?? "",
        slotId: selectedSlotId,
        symptoms: symptoms.trim(),
        question: question.trim(),
        notes: notes.trim() || null,
      });
      router.replace("/(customer)/my-orders");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Хүсэлт илгээхэд алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: "Хүсэлт илгээх" }} />
      <FormScrollView className="flex-1 px-5 pt-5 bg-app-bg" contentContainerStyle={{ paddingBottom: 40 }}>
        <SectionHeader
          title="Үнэгүй зөвлөгөө"
          subtitle="Цаг сонгоод биеийн байдал, асуултаа илгээнэ үү."
        />

        <Card className="mb-4">
          <Text className="text-xs text-app-text-muted">Эмнэлэг</Text>
          <Text className="mt-1 text-base font-semibold text-app-text">{clinicName}</Text>
          <Text className="mt-3 text-xs text-app-text-muted">Эмч</Text>
          <Text className="mt-1 text-base font-semibold text-app-text">{doctorName}</Text>
          <Text className="mt-3 text-xs text-app-text-muted">Төлөв</Text>
          <Text className="mt-1 text-sm text-app-text">{getConsultationStatusLabel("pending")}</Text>
        </Card>

        <Card className="mb-4">
          <Text className="mb-2 text-xs font-bold uppercase tracking-wide text-app-text-muted">Боломжит цаг</Text>
          {slotsLoading ? (
            <ActivityIndicator />
          ) : slots.length === 0 ? (
            <Text className="text-sm text-app-text-secondary">Энэ эмчийн боломжит цаг одоогоор байхгүй.</Text>
          ) : (
            <View className="gap-2">
              {slots.map((s) => {
                const active = selectedSlotId === s.id;
                return (
                  <Pressable key={s.id} onPress={() => setSelectedSlotId(s.id)}>
                    <View
                      className={`flex-row items-center gap-2 rounded-2xl border px-4 py-3 ${
                        active ? "border-brand-600 bg-brand-50 dark:border-brand-400 dark:bg-brand-950/30" : "border-app-border"
                      }`}
                    >
                      <MaterialCommunityIcons name="clock-outline" size={18} color={active ? "#2563eb" : "#94a3b8"} />
                      <Text className={`text-sm font-medium ${active ? "text-brand-700 dark:text-brand-300" : "text-app-text"}`}>
                        {s.label}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </Card>

        <Card className="mb-4 gap-3">
          <Input
            label="Биеийн байдал"
            value={symptoms}
            onChangeText={setSymptoms}
            placeholder="Одоогийн шинж тэмдэг, байдал…"
            multiline
          />
          <Input
            label="Асуух зүйл"
            value={question}
            onChangeText={setQuestion}
            placeholder="Эмчээс юу асуух вэ?"
            multiline
          />
          <Input
            label="Нэмэлт тайлбар"
            value={notes}
            onChangeText={setNotes}
            placeholder="Сонголттой"
            multiline
          />
        </Card>

        {error ? <AuthMessageBanner variant="error" message={error} className="mb-4" /> : null}

        <Button label="Хүсэлт илгээх" loading={loading} onPress={onSubmit} className="shadow-md" />
        <Text className="mt-3 text-center text-xs leading-5 text-app-text-muted">
          Эмч зөвшөөрсний дараа уулзалтын холбоос харагдана.
        </Text>
        <Button label="Буцах" variant="ghost" className="mt-6" onPress={() => router.back()} />
      </FormScrollView>
    </>
  );
}
