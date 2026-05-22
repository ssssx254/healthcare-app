import { AuthMessageBanner, Button, Card, FormScrollView, Input, SectionHeader, SlotDayTimePicker } from "@/components";
import { getConsultationStatusLabel } from "@/constants/consultationStatus";
import { useCustomerBooking } from "@/contexts/CustomerBookingContext";
import { ApiError } from "@/lib/api/client";
import { consultationApi, type FreeConsultSlotOption } from "@/services/api/consultationApi";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Text } from "react-native";

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
      const data = await consultationApi.listFreeAvailability(undefined, { skipCache: true });
      const doc = data.items.find((d) => String(d.doctor_id) === String(doctorId));
      const list = doc?.slots ?? [];
      setSlots(list);
      setSelectedSlotId(list[0]?.id ?? null);
    } catch {
      setSlots([]);
      setSelectedSlotId(null);
    } finally {
      setSlotsLoading(false);
    }
  }, [doctorId, clinicId]);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  const onSubmit = async () => {
    if (!doctorId || !clinicId || !selectedSlotId) {
      setError("Өдөр, цаг сонгоно уу.");
      return;
    }
    if (!symptoms.trim() || !question.trim()) {
      setError("Биеийн байдал болон асуух зүйлийг бөглөнө үү.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const created = await addFreeConsultOrder({
        clinicId,
        clinicName: clinicName ?? "",
        doctorId,
        doctorName: doctorName ?? "",
        slotId: selectedSlotId,
        symptoms: symptoms.trim(),
        question: question.trim(),
        notes: notes.trim() || null,
      });
      if (created?.id) {
        router.replace({ pathname: "/(customer)/my-orders/[orderId]", params: { orderId: created.id } });
      } else {
        router.replace("/(customer)/my-orders");
      }
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
          subtitle="Эхлээд өдөр, дараа нь цаг сонгоод хүсэлтээ илгээнэ үү."
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
          <Text className="mb-3 text-xs font-bold uppercase tracking-wide text-app-text-muted">Цаг сонгох</Text>
          {slotsLoading ? (
            <ActivityIndicator />
          ) : (
            <SlotDayTimePicker
              slots={slots}
              selectedSlotId={selectedSlotId}
              onSelectSlotId={setSelectedSlotId}
              emptyLabel="Энэ эмчийн боломжит цаг одоогоор байхгүй."
            />
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
        <Button label="Буцах" variant="ghost" className="mt-6 self-auto" onPress={() => router.back()} />
      </FormScrollView>
    </>
  );
}
