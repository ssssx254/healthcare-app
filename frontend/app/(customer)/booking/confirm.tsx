import { Button, Card, FormScrollView, SectionHeader } from "@/components";
import { orderStatusLabel } from "@/constants/orderStatus";
import { useCustomerBooking } from "@/contexts/CustomerBookingContext";
import { ApiError } from "@/lib/api/client";
import { router, Stack } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";

export default function ConfirmBookingScreen() {
  const { draft, createFormalOrderAfterConfirm } = useCustomerBooking();
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const QUESTIONNAIRE_REQUIRED = false;

  const missingBookingCore =
    !draft.clinicId ||
    !draft.clinicName ||
    !draft.doctorId ||
    !draft.doctorName ||
    !draft.serviceId ||
    !(draft.serviceName ?? draft.serviceTitle) ||
    draft.kind !== "formal" ||
    (draft.price ?? draft.priceMnt) === null ||
    !draft.slotId ||
    !draft.selectedDate ||
    !draft.selectedTime;
  const questionnaireDone =
    draft.questionnaireCompleted ||
    draft.symptoms.trim().length > 0 ||
    draft.chronicIllness.trim().length > 0 ||
    draft.medications.trim().length > 0 ||
    draft.allergies.trim().length > 0;
  const questionnaireMissing = QUESTIONNAIRE_REQUIRED && !questionnaireDone;
  const missing = missingBookingCore || questionnaireMissing;

  const slotDate = draft.selectedDate ?? "—";
  const slotTime = draft.selectedTime ?? "—";

  const onConfirm = async () => {
    if (missing || loading) return;
    setFormError(null);
    try {
      setLoading(true);
      const order = await createFormalOrderAfterConfirm();
      if (!order) return;
      router.replace({ pathname: "/booking/payment-method", params: { orderId: order.id, amount: String(order.priceMnt) } });
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Захиалга үүсгэхэд алдаа гарлаа.";
      setFormError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: "Захиалга баталгаажуулах" }} />
      <FormScrollView
        className="flex-1 bg-app-bg"
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
      >
        <SectionHeader
          title="Захиалга баталгаажуулах"
          subtitle="Мэдээллээ шалгаад үргэлжлүүлнэ үү."
        />

        {missing ? (
          <Card>
            <Text className="text-sm text-red-600 dark:text-red-400">
              Мэдээлэл дутуу байна. Доорх алхмаар үргэлжлүүлнэ үү.
            </Text>
            {questionnaireMissing ? (
              <Button label="Анкет бөглөх" className="mt-4" onPress={() => router.push("/(customer)/health-form")} />
            ) : (
              <Button label="Цаг дахин сонгох" className="mt-4" onPress={() => router.replace("/(customer)/booking/select-day")} />
            )}
          </Card>
        ) : (
          <>
            <Card className="mb-4">
              <Row label="Эмнэлэг" value={draft.clinicName!} />
              <Row label="Эмч" value={draft.doctorName!} />
              <Row label="Үйлчилгээ" value={(draft.serviceName ?? draft.serviceTitle)!} />
              <Row label="Огноо" value={slotDate} />
              <Row label="Цаг" value={slotTime} />
              <Row label="Хугацаа" value={(draft.duration ?? draft.durationMinutes) != null ? `${draft.duration ?? draft.durationMinutes} минут` : "—"} />
              <Row label="Үнэ" value={`${(draft.price ?? draft.priceMnt)?.toString() ?? "0"} ₮`} />
              <View className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                <Text className="text-sm text-app-text-secondary">Төлөв</Text>
                <Text className="mt-1 text-sm font-medium text-amber-700 dark:text-amber-300">
                  {orderStatusLabel.pending} — дараагийн алхамд төлбөр төлнө үү.
                </Text>
              </View>
            </Card>

            {formError ? (
              <Text className="mb-2 text-sm text-red-600 dark:text-red-400">{formError}</Text>
            ) : null}
            <Button label="Төлбөр төлөх" loading={loading} onPress={onConfirm} />
            <Button label="Буцах" variant="ghost" className="mt-2" onPress={() => router.back()} />
          </>
        )}
      </FormScrollView>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="mb-3">
      <Text className="text-xs font-medium uppercase tracking-wide text-app-text-muted">
        {label}
      </Text>
      <Text className="mt-0.5 text-base text-app-text">{value}</Text>
    </View>
  );
}
