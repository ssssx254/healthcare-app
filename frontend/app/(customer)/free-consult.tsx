import { Button, Card, FormScrollView, SectionHeader } from "@/components";
import { useCustomerBooking } from "@/contexts/CustomerBookingContext";
import { ApiError } from "@/lib/api/client";
import { toFriendlyErrorMn } from "@/lib/friendlyErrorMn";
import { router, Stack } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";

export default function FreeConsultScreen() {
  const { draft, addFreeConsultOrder } = useCustomerBooking();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const canStart =
    draft.clinicId &&
    draft.clinicName &&
    draft.doctorId &&
    draft.doctorName &&
    draft.serviceId &&
    draft.serviceTitle &&
    draft.kind === "free_online";

  const onFinish = async () => {
    if (!message.trim()) return;
    if (!canStart || !draft.clinicId || !draft.clinicName || !draft.doctorId || !draft.doctorName || !draft.serviceId || !draft.serviceTitle) {
      return;
    }
    setFormError(null);
    setLoading(true);
    try {
      await addFreeConsultOrder({
        clinicId: draft.clinicId,
        clinicName: draft.clinicName,
        doctorId: draft.doctorId,
        doctorName: draft.doctorName,
        serviceId: draft.serviceId,
        serviceTitle: draft.serviceTitle,
        patientMessage: message.trim(),
      });
      router.replace("/(customer)/my-orders");
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Захиалга үүсгэхэд алдаа гарлаа.";
      setFormError(toFriendlyErrorMn(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: "Үнэгүй онлайн зөвлөгөө" }} />
      <FormScrollView
        className="flex-1 bg-app-bg"
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
      >
        <SectionHeader
          title="Үнэгүй онлайн зөвлөгөө"
          subtitle="Төлбөргүй — анхан шатны зөвлөгөөг чат эсвэл богино мессежээр авах."
        />

        {!canStart ? (
          <Card>
            <Text className="text-sm leading-6 text-app-text-secondary">
              Эхлээд эмнэлэг, дараа нь эмч, үнэгүй үйлчилгээг сонгоно уу. Дараа нь энд буцаж ирнэ үү.
            </Text>
            <Button label="Эмнэлгүүд рүү" className="mt-4" onPress={() => router.push("/(customer)/clinics")} />
          </Card>
        ) : (
          <>
            <Card className="mb-3">
              <Text className="text-sm text-app-text-secondary">
                Эмнэлэг: {draft.clinicName}
              </Text>
              <Text className="mt-1 text-sm text-app-text-secondary">Эмч: {draft.doctorName}</Text>
              <Text className="mt-1 text-sm text-app-text-secondary">
                Үйлчилгээ: {draft.serviceTitle}
              </Text>
            </Card>

            <Card>
              <Text className="text-sm font-semibold text-app-text">Чат (жишээ)</Text>
              <View className="mt-3 rounded-xl p-3 bg-app-muted">
                <Text className="text-sm text-app-text-secondary">
                  Систем: Сайн байна уу? Таны асуудлыг товчхон бичнэ үү.
                </Text>
              </View>
              <Text className="mt-3 text-xs text-app-text-muted">
                Доорх талбарт өөрийн мэдээллийг бичээд дуусгана уу.
              </Text>
              <Button
                label={message ? "Зурвас илгээх (жишээ)" : "Зурвас бичнэ үү"}
                variant="secondary"
                className="mt-3"
                onPress={() => setMessage("Би эрүүл мэндийн зөвлөгөө хүсэж байна.")}
              />
              {message ? (
                <View className="mt-2 rounded-xl bg-brand-50 p-3 dark:bg-brand-900">
                  <Text className="text-sm text-app-text">{message}</Text>
                </View>
              ) : null}
            </Card>

            {formError ? (
              <Text className="mt-2 text-sm text-red-600 dark:text-red-400">{formError}</Text>
            ) : null}
            <Button label="Зөвлөгөөг дуусгах" className="mt-4" loading={loading} onPress={onFinish} />
            <Text className="mt-2 text-center text-xs text-app-text-muted">
              Үнэгүй зөвлөгөө — төлбөр шаардлагагүй.
            </Text>
          </>
        )}
      </FormScrollView>
    </>
  );
}
