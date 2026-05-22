import { Badge, Button, Card, FormScrollView, Input, ScreenScrollView, SectionHeader } from "@/components";
import { SharedLabTestsCard } from "@/components/SharedLabTestsCard";
import { orderStatusLabel } from "@/constants/orderStatus";
import { providerBookingStatusLabel } from "@/constants/providerBookingStatus";
import { useProviderWorkspace } from "@/contexts/ProviderWorkspaceContext";
import { answersJsonToSummary } from "@/lib/questionnaireDisplay";
import { addProviderPatientNote } from "@/data/healthcare/providerNotesStore";
import { consultationNumericId, isConsultationOrderId } from "@/lib/api/orderIds";
import { routes } from "@/constants/appRoutes";
import { bookingApi } from "@/services/api/bookingApi";
import { consultationApi } from "@/services/api/consultationApi";
import { questionnaireApi } from "@/services/api/questionnaireApi";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Linking, Text, View } from "react-native";

export default function ProviderOrderDetailScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { bookings, setBookingStatus, setMeetingLink } = useProviderWorkspace();
  const booking = useMemo(() => bookings.find((b) => b.id === orderId), [bookings, orderId]);
  const bookingId = booking?.id;
  const [link, setLink] = useState("");
  const [remoteHealth, setRemoteHealth] = useState<string | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState("");
  const [advice, setAdvice] = useState("");
  const [treatment, setTreatment] = useState("");
  const [providerNotes, setProviderNotes] = useState("");

  useEffect(() => {
    if (booking) setLink(booking.meetingLink ?? "");
    else setLink("");
  }, [booking?.id, booking?.meetingLink]);

  useEffect(() => {
    if (!bookingId) {
      setRemoteHealth(null);
      return;
    }
    const id = bookingId;
    let alive = true;
    async function loadHealth() {
      setHealthLoading(true);
      try {
        if (isConsultationOrderId(id)) {
          const row = await consultationApi.getById(consultationNumericId(id));
          const combined = [
            row.symptoms ? `Биеийн байдал: ${row.symptoms}` : null,
            row.question ? `Асуух зүйл: ${row.question}` : null,
            row.notes ? `Нэмэлт: ${row.notes}` : null,
          ]
            .filter(Boolean)
            .join("\n\n");
          if (alive) {
            setRemoteHealth(combined || row.patient_message || null);
            setProviderNotes(row.provider_notes ?? row.provider_message ?? "");
          }
          return;
        }
        const detail = await bookingApi.getById(id);
        const qid = detail.latest_questionnaire_id;
        if (!qid) {
          if (alive) setRemoteHealth(null);
          return;
        }
        const q = await questionnaireApi.getById(qid);
        const raw = q.answers_json;
        if (alive) setRemoteHealth(answersJsonToSummary(raw));
      } catch {
        if (alive) setRemoteHealth(null);
      } finally {
        if (alive) setHealthLoading(false);
      }
    }
    void loadHealth();
    return () => {
      alive = false;
    };
  }, [bookingId]);

  if (!booking) {
    return (
      <>
        <Stack.Screen options={{ title: "Захиалгын дэлгэрэнгүй" }} />
        <ScreenScrollView className="flex-1 p-4 bg-app-bg">
          <Card>
            <Text className="text-center text-app-text-secondary">Захиалга олдсонгүй.</Text>
            <Button label="Жагсаалт руу" className="mt-4" onPress={() => router.replace(routes.providerOrdersRequests)} />
          </Card>
        </ScreenScrollView>
      </>
    );
  }

  const canDecide = booking.providerStatus === "pending_request";
  const healthText = booking.healthSummary ?? remoteHealth;

  return (
    <>
      <Stack.Screen options={{ title: "Захиалгын дэлгэрэнгүй" }} />
      <FormScrollView
        className="flex-1 bg-app-bg"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      >
        <SectionHeader
          title={booking.patientName ?? "Үйлчлүүлэгч"}
          subtitle={booking.serviceTitle}
          action={<Badge label={providerBookingStatusLabel[booking.providerStatus]} tone="neutral" />}
        />

        {formError ? (
          <Text className="mb-2 text-sm text-red-600 dark:text-red-400">{formError}</Text>
        ) : null}

        <Card className="mb-3">
          <Text className="text-xs text-app-text-muted">Эмч</Text>
          <Text className="mt-1 text-base text-app-text">{booking.doctorName}</Text>
          {booking.slotLabel ? (
            <>
              <Text className="mt-3 text-xs text-app-text-muted">Цаг</Text>
              <Text className="mt-1 text-base text-app-text">{booking.slotLabel}</Text>
            </>
          ) : null}
          <Text className="mt-3 text-xs text-app-text-muted">Төлбөр</Text>
          <Text className="mt-1 text-base text-app-text">
            {booking.kind === "free_online" ? orderStatusLabel.free_consult : `${booking.priceMnt.toString()} ₮`}
          </Text>
          <Text className="mt-3 text-xs text-app-text-muted">Төлбөр төлөгдсөн эсэх</Text>
          <Text className="mt-1 text-base text-app-text">
            {booking.paymentStatus === "paid" ? "Төлөгдсөн" : booking.paymentStatus === "refunded" ? "Буцаалттай" : "Төлөгдөөгүй"}
          </Text>
          <Text className="mt-3 text-xs text-app-text-muted">Огноо</Text>
          <Text className="mt-1 text-sm text-app-text-secondary">
            {new Date(booking.createdAtIso).toLocaleString("mn-MN")}
          </Text>
        </Card>

        {healthLoading ? (
          <Card className="mb-3">
            <Text className="text-sm text-app-text-muted">Анкет ачааллаж байна…</Text>
          </Card>
        ) : healthText ? (
          <Card className="mb-3">
            <Text className="text-sm font-semibold text-app-text">
              {bookingId && isConsultationOrderId(bookingId) ? "Өвчтөний зурвас" : "Анкет харах"}
            </Text>
            <Text className="mt-1 text-xs text-app-text-muted">
              {bookingId && isConsultationOrderId(bookingId)
                ? "Үнэгүй зөвлөгөөний хүсэлтээр ирсэн мэдээлэл."
                : "Өвчтөний бөглөсөн мэдээлэл."}
            </Text>
            <Text className="mt-3 text-sm leading-6 text-app-text-secondary">{healthText}</Text>
          </Card>
        ) : (
          <Card className="mb-3">
            <Text className="text-sm text-app-text-muted">Анкетын мэдээлэл ирээгүй байна.</Text>
          </Card>
        )}

        {bookingId && !isConsultationOrderId(bookingId) ? (
          <SharedLabTestsCard
            bookingId={bookingId}
            title="Үйлчлүүлэгчийн хуваалцсан шинжилгээ"
            emptyText="Энэ захиалгад үйлчлүүлэгч шинжилгээ хуваалаагүй. Зөвхөн сонгосон тохиолдолд энд харагдана."
          />
        ) : null}

        {booking.kind === "free_online" && (booking.symptoms || booking.question || booking.consultNotes) ? (
          <Card className="mb-3">
            <Text className="text-sm font-semibold text-app-text">Үнэгүй зөвлөгөөний хүсэлт</Text>
            {booking.symptoms ? (
              <Text className="mt-2 text-sm text-app-text-secondary">Биеийн байдал: {booking.symptoms}</Text>
            ) : null}
            {booking.question ? (
              <Text className="mt-2 text-sm text-app-text-secondary">Асуух зүйл: {booking.question}</Text>
            ) : null}
            {booking.consultNotes ? (
              <Text className="mt-2 text-sm text-app-text-secondary">Нэмэлт: {booking.consultNotes}</Text>
            ) : null}
          </Card>
        ) : null}

        <Card className="mb-3">
          <Text className="text-sm font-semibold text-app-text">
            {booking.kind === "free_online" ? "Google Meet холбоос" : "Онлайн уулзалтын холбоос илгээх"}
          </Text>
          <Text className="mt-1 text-xs text-app-text-muted">
            {booking.kind === "free_online"
              ? "Зөвшөөрсний дараа үйлчлүүлэгчид холбоос харагдана."
              : "Видео уулзалтын холбоосыг (жишээ нь Meet, Zoom) энд хадгална."}
          </Text>
          <Input
            label="Холбоос"
            value={link}
            onChangeText={setLink}
            placeholder="Жишээ: https://meet.google.com/abc-defg-hij"
            autoCapitalize="none"
          />
          <Button
            label="Холбоос хадгалах"
            variant="secondary"
            className="mt-2"
            loading={actionLoading}
            onPress={() => {
              void (async () => {
                setFormError(null);
                setActionLoading(true);
                try {
                  await setMeetingLink(booking.id, link);
                } catch (e) {
                  const msg = e instanceof Error ? e.message : "Хадгалахад алдаа гарлаа.";
                  setFormError(msg);
                } finally {
                  setActionLoading(false);
                }
              })();
            }}
          />
          {booking.meetingLink ? (
            <Button
              label="Холбоосыг нээх"
              variant="outline"
              className="mt-2"
              onPress={() => Linking.openURL(booking.meetingLink!)}
            />
          ) : null}
        </Card>

        <Button
          label="Үйлчлүүлэгчтэй чат"
          variant="outline"
          className="mb-3"
          onPress={() => router.push({ pathname: routes.providerChat, params: { patient: booking.patientName } })}
        />

        {booking.kind === "free_online" ? (
          <Card className="mb-3">
            <Text className="text-sm font-semibold text-app-text">Эмчийн нэмэлт тэмдэглэл</Text>
            <Input
              label="Тэмдэглэл"
              value={providerNotes}
              onChangeText={setProviderNotes}
              placeholder="Уулзалтын өмнө/дараах тэмдэглэл…"
              multiline
            />
            <Button
              label="Тэмдэглэл хадгалах"
              variant="secondary"
              className="mt-2"
              loading={actionLoading}
              onPress={() => {
                if (!isConsultationOrderId(booking.id)) return;
                void (async () => {
                  setFormError(null);
                  setActionLoading(true);
                  try {
                    await consultationApi.update(consultationNumericId(booking.id), {
                      provider_notes: providerNotes.trim() || null,
                    });
                  } catch (e) {
                    setFormError(e instanceof Error ? e.message : "Хадгалахад алдаа гарлаа.");
                  } finally {
                    setActionLoading(false);
                  }
                })();
              }}
            />
          </Card>
        ) : null}

        <Card className="mb-3">
          <Text className="text-sm font-semibold text-app-text">Эмчийн тэмдэглэл</Text>
          <Text className="mt-1 text-xs text-app-text-muted">
            Үзлэгийн дараа онош, зөвлөгөө, эмчилгээг хадгална.
          </Text>
          <Input label="Онош" value={diagnosis} onChangeText={setDiagnosis} placeholder="Онош оруулна уу" />
          <Input label="Зөвлөгөө" value={advice} onChangeText={setAdvice} placeholder="Зөвлөгөө оруулна уу" />
          <Input label="Эмчилгээ" value={treatment} onChangeText={setTreatment} placeholder="Эмчилгээ оруулна уу" />
          <Button
            label="Тэмдэглэл хадгалах"
            variant="secondary"
            className="mt-1"
            onPress={() => {
              if (!diagnosis.trim() || !advice.trim() || !treatment.trim()) {
                setFormError("Онош, зөвлөгөө, эмчилгээ бүгдийг бөглөнө үү.");
                return;
              }
              addProviderPatientNote({
                bookingId: booking.id,
                patientId: booking.patientId,
                patientName: booking.patientName,
                doctorName: booking.doctorName,
                diagnosis: diagnosis.trim(),
                advice: advice.trim(),
                treatment: treatment.trim(),
              });
              setDiagnosis("");
              setAdvice("");
              setTreatment("");
              setFormError(null);
            }}
          />
        </Card>

        {canDecide ? (
          <View className="gap-2">
            <Button
              label={booking.kind === "free_online" ? "Зөвшөөрөх" : "Батлах"}
              loading={actionLoading}
              onPress={() => {
                void (async () => {
                  setFormError(null);
                  setActionLoading(true);
                  try {
                    await setBookingStatus(booking.id, "confirmed");
                    router.back();
                  } catch (e) {
                    const msg = e instanceof Error ? e.message : "Алдаа гарлаа.";
                    setFormError(msg);
                  } finally {
                    setActionLoading(false);
                  }
                })();
              }}
            />
            <Button
              label="Татгалзах"
              variant="secondary"
              loading={actionLoading}
              onPress={() => {
                void (async () => {
                  setFormError(null);
                  setActionLoading(true);
                  try {
                    await setBookingStatus(booking.id, "rejected");
                    router.back();
                  } catch (e) {
                    const msg = e instanceof Error ? e.message : "Алдаа гарлаа.";
                    setFormError(msg);
                  } finally {
                    setActionLoading(false);
                  }
                })();
              }}
            />
            <Button
              label="Цуцлах (эмнэлэг)"
              variant="outline"
              loading={actionLoading}
              onPress={() => {
                void (async () => {
                  setFormError(null);
                  setActionLoading(true);
                  try {
                    await setBookingStatus(booking.id, "cancelled_clinic");
                    router.back();
                  } catch (e) {
                    const msg = e instanceof Error ? e.message : "Алдаа гарлаа.";
                    setFormError(msg);
                  } finally {
                    setActionLoading(false);
                  }
                })();
              }}
            />
          </View>
        ) : (
          <View className="gap-2">
            {booking.providerStatus === "confirmed" ? (
              <Button
                label="Дуусгах"
                loading={actionLoading}
                onPress={() => {
                  void (async () => {
                    setFormError(null);
                    setActionLoading(true);
                    try {
                      await setBookingStatus(booking.id, "completed");
                      router.back();
                    } catch (e) {
                      const msg = e instanceof Error ? e.message : "Алдаа гарлаа.";
                      setFormError(msg);
                    } finally {
                      setActionLoading(false);
                    }
                  })();
                }}
              />
            ) : null}
            <Text className="text-center text-sm text-app-text-muted">
              Энэ захиалгын төлөв: {providerBookingStatusLabel[booking.providerStatus]}
            </Text>
          </View>
        )}
      </FormScrollView>
    </>
  );
}
