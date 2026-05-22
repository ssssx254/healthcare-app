import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  ScreenScrollView,
  SectionHeader,
} from "@/components";
import { getLabTestStatusLabel, labTestStatusTone } from "@/constants/labTestStatus";
import { providerBookingStatusLabel, type ProviderBookingStatus } from "@/constants/providerBookingStatus";
import { listProviderPatientNotesByPatient } from "@/data/healthcare/providerNotesStore";
import { useProviderWorkspace } from "@/contexts/ProviderWorkspaceContext";
import { labTestsApi, type LabTestRow } from "@/services/api/labTestsApi";
import { toFriendlyErrorMn } from "@/lib/friendlyErrorMn";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { Stack, router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

function isNumericPatientId(id: string): boolean {
  return /^\d+$/.test(id.trim());
}

export default function ProviderPatientDetailScreen() {
  const { patientId: patientIdParam } = useLocalSearchParams<{ patientId: string }>();
  const { bookings, clinic } = useProviderWorkspace();
  const { isOnline } = useNetworkStatus();
  const patientKey = patientIdParam?.trim() || "";
  const byUserId = isNumericPatientId(patientKey);

  const patientName = useMemo(() => {
    if (!patientKey) return "Үйлчлүүлэгч";
    const match = bookings.find((b) =>
      byUserId ? String(b.patientId) === patientKey : (b.patientName ?? "Үйлчлүүлэгч") === patientKey,
    );
    return match?.patientName ?? (byUserId ? `Өвчтөн #${patientKey}` : patientKey);
  }, [bookings, patientKey, byUserId]);

  const history = useMemo(
    () =>
      bookings
        .filter((b) =>
          byUserId ? String(b.patientId) === patientKey : (b.patientName ?? "Үйлчлүүлэгч") === patientKey,
        )
        .sort((a, b) => b.createdAtIso.localeCompare(a.createdAtIso)),
    [bookings, patientKey, byUserId],
  );

  const notes = listProviderPatientNotesByPatient(patientName);
  const patientUserId = byUserId ? Number(patientKey) : Number(history[0]?.patientId);
  const clinicId = clinic.id ? Number(clinic.id) : null;

  const [labItems, setLabItems] = useState<LabTestRow[]>([]);
  const [labLoading, setLabLoading] = useState(false);
  const [labError, setLabError] = useState<string | null>(null);

  const loadLabs = useCallback(async () => {
    if (!byUserId || !patientUserId || Number.isNaN(patientUserId)) {
      setLabItems([]);
      return;
    }
    setLabLoading(true);
    setLabError(null);
    try {
      const res = await labTestsApi.listForProvider({ patient_user_id: patientUserId });
      setLabItems(res.items ?? []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Шинжилгээ ачааллахад алдаа гарлаа.";
      setLabError(toFriendlyErrorMn(msg));
      setLabItems([]);
    } finally {
      setLabLoading(false);
    }
  }, [byUserId, patientUserId]);

  useFocusEffect(
    useCallback(() => {
      void loadLabs();
    }, [loadLabs]),
  );

  return (
    <>
      <Stack.Screen options={{ title: "Өвчтөний дэлгэрэнгүй" }} />
      <ScreenScrollView className="flex-1 bg-app-bg" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <SectionHeader title={patientName} subtitle="Үзлэгийн түүх, шинжилгээ, тэмдэглэл." />

        {!isOnline ? (
          <Card className="mb-3 border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950">
            <Text className="text-xs text-amber-900 dark:text-amber-100">Офлайн — зарим мэдээлэл хуучин байж болно.</Text>
          </Card>
        ) : null}

        <Card className="mb-3">
          <Text className="text-sm font-semibold text-app-text">Хуваалцсан шинжилгээ</Text>
          <Text className="mt-1 text-xs text-app-text-muted">
            Зөвхөн үйлчлүүлэгч захиалгад сонгож хуваалсан эсвэл эмнэлэгийн хариу.
          </Text>
          {!byUserId ? (
            <Text className="mt-2 text-xs text-app-text-muted">Шинжилгээний API-д хэрэглэгчийн ID шаардлагатай.</Text>
          ) : null}

          {labError ? (
            <ErrorState
              className="mt-2"
              title="Шинжилгээ ачаалагдаагүй"
              message={labError}
              onRetry={() => void loadLabs()}
              retryLabel="Дахин оролдох"
            />
          ) : null}

          {labLoading && labItems.length === 0 && !labError ? (
            <View className="mt-2">
              <LoadingState compact title="Шинжилгээ ачааллаж байна…" />
            </View>
          ) : null}

          {!labLoading && !labError && byUserId && labItems.length === 0 ? (
            <View className="mt-2">
              <EmptyState
                icon="flask-outline"
              title="Хуваалцсан шинжилгээ алга"
              description="Өвчтөн эмчид шинжилгээ хуваалаагүй байна. Захиалга үүсэхэд «Шинжилгээ хуваалцах» алхмаар сонгоно."
              />
            </View>
          ) : null}

          {labItems.length > 0 ? (
            <View className="mt-2 gap-2">
              {labItems.map((lt) => (
                <Pressable
                  key={lt.id}
                  onPress={() => router.push(`/(provider)/lab-tests/${lt.id}` as never)}
                >
                  <View className="rounded-xl border border-app-border bg-app-muted/80 px-3 py-2.5">
                    <View className="flex-row items-center justify-between gap-2">
                      <Text className="flex-1 text-sm font-medium text-app-text" numberOfLines={1}>
                        {lt.title}
                      </Text>
                      <Badge
                        label={getLabTestStatusLabel(lt.status, lt.uploaded_by)}
                        tone={labTestStatusTone(lt.status, lt.uploaded_by)}
                      />
                    </View>
                    <Text className="mt-1 text-xs text-app-text-muted">
                      {lt.test_type} · {lt.test_date}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : null}

          {byUserId && clinicId ? (
            <Button
              label="Шинжилгээний хариу нэмэх"
              variant="outline"
              className="mt-3"
              onPress={() =>
                router.push({
                  pathname: "/(provider)/lab-tests/add",
                  params: { patientUserId: String(patientUserId), clinicId: String(clinicId) },
                } as never)
              }
            />
          ) : null}
        </Card>

        <Card className="mb-3">
          <Text className="text-sm font-semibold text-app-text">Үзлэгийн түүх</Text>
          {history.length === 0 ? (
            <Text className="mt-2 text-xs text-app-text-muted">Үзлэгийн түүх алга.</Text>
          ) : (
            <View className="mt-2 gap-2">
              {history.map((h) => (
                <View key={h.id} className="rounded-xl border border-app-border bg-app-muted/80 px-3 py-2.5">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm font-medium text-app-text">{h.serviceTitle}</Text>
                    <Badge
                      label={
                        providerBookingStatusLabel[h.providerStatus as ProviderBookingStatus] ?? h.providerStatus
                      }
                      tone="neutral"
                    />
                  </View>
                  <Text className="mt-1 text-xs text-app-text-muted">
                    Огноо: {h.date ?? h.createdAtIso.slice(0, 10)} · Цаг: {h.time ?? "—"}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </Card>

        <Card className="mb-3">
          <Text className="text-sm font-semibold text-app-text">Эмчийн тэмдэглэл (захиалгаас)</Text>
          {notes.length === 0 ? (
            <Text className="mt-2 text-xs text-app-text-muted">Одоогоор тэмдэглэл бүртгэгдээгүй байна.</Text>
          ) : (
            <View className="mt-2 gap-2">
              {notes.map((n) => (
                <View key={n.id} className="rounded-xl border border-app-border bg-app-muted/80 px-3 py-2.5">
                  <Text className="text-xs text-app-text-secondary">Онош: {n.diagnosis}</Text>
                  <Text className="mt-1 text-xs text-app-text-secondary">Зөвлөгөө: {n.advice}</Text>
                </View>
              ))}
            </View>
          )}
        </Card>
      </ScreenScrollView>
    </>
  );
}
