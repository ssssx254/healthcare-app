import { AppImage, Badge, Button, Card, EmptyState, LoadingState, ScreenScrollView, SectionHeader } from "@/components";
import { routes } from "@/constants/appRoutes";
import { orderStatusLabel } from "@/constants/orderStatus";
import { useCustomerBooking } from "@/contexts/CustomerBookingContext";
import { useChatSync } from "@/hooks/useChatSync";
import { resolveDoctorAvatarUri } from "@/lib/doctorAvatar";
import { getClinicById, getDoctor, getServicesByDoctor } from "@/services/customerCatalog";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Linking, Text, View } from "react-native";
import type { MockDoctor, MockService } from "@/types/customer";

function serviceStatusBadge(kind: MockService["kind"]) {
  if (kind === "free_online") return { label: orderStatusLabel.free_consult, tone: "success" as const };
  return { label: orderStatusLabel.payment_required, tone: "warning" as const };
}

function doctorRatingLabel(id: string): string {
  const n = Number(id.replace(/\D/g, "").slice(-1) || "7");
  return (4.5 + (n % 5) * 0.1).toFixed(1);
}

export default function DoctorDetailScreen() {
  const { clinicId, doctorId } = useLocalSearchParams<{ clinicId: string; doctorId: string }>();
  const { setDraftClinic, setDraftDoctor } = useCustomerBooking();
  const { ensureCustomerConversation } = useChatSync();
  const [doctor, setDoctor] = useState<MockDoctor | null | undefined>(undefined);
  const [services, setServices] = useState<MockService[] | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  useEffect(() => {
    if (!clinicId) return;
    let alive = true;
    getClinicById(String(clinicId)).then((clinic) => {
      if (!alive || !clinic) return;
      setDraftClinic(clinic.id, clinic.name);
    });
    return () => {
      alive = false;
    };
  }, [clinicId, setDraftClinic]);

  useEffect(() => {
    if (!clinicId || !doctorId) return;
    let alive = true;
    getDoctor(String(clinicId), String(doctorId)).then((d) => {
      if (alive) setDoctor(d ?? null);
    });
    return () => {
      alive = false;
    };
  }, [clinicId, doctorId]);

  useEffect(() => {
    if (!doctorId) return;
    let alive = true;
    getServicesByDoctor(String(doctorId))
      .then((s) => {
        if (alive) setServices(s);
      })
      .catch(() => {
        if (alive) setServices([]);
      });
    return () => {
      alive = false;
    };
  }, [doctorId]);

  useEffect(() => {
    if (doctor) setDraftDoctor(doctor.id, doctor.name);
  }, [doctor, setDraftDoctor]);

  const expYears = doctor && doctor.experienceYears != null ? `${doctor.experienceYears} жил` : "—";
  const openChat = async () => {
    if (!clinicId) return;
    setChatError(null);
    setChatLoading(true);
    try {
      const conversationId = await ensureCustomerConversation({ clinicId: Number(clinicId) });
      router.push({ pathname: routes.customerChatDetail, params: { conversationId } });
    } catch (e) {
      setChatError(e instanceof Error ? e.message : "Чат нээх үед алдаа гарлаа.");
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: "Эмчийн дэлгэрэнгүй" }} />
      <ScreenScrollView
        className="flex-1 bg-slate-50 dark:bg-slate-950"
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
      >
        {doctor === undefined || services === null ? (
          <Card>
            <LoadingState compact title="Эмчийн мэдээлэл ачааллаж байна…" subtitle="Үйлчилгээний жагсаалттай хамт татагдаж байна." />
          </Card>
        ) : doctor == null ? (
          <Card className="overflow-hidden">
            <EmptyState
              icon="account-question-outline"
              title="Эмч олдсонгүй"
              description="Холбоос буруу эсвэл эмчийн бүртгэл хасагдсан байж магадгүй. Эмнэлгийн жагсаалтаас дахин сонгоно уу."
              action={{ label: "Эмч нар руу", onPress: () => router.push(`/clinic/${clinicId}/doctors`), variant: "outline" }}
            />
          </Card>
        ) : (
          <>
            <SectionHeader title="Эмчийн танилцуулга" subtitle="Мэргэжил, үйлчилгээ, боловсролын мэдээлэл." />

            <Card className="mb-4">
              <View className="flex-row items-start gap-3">
                <AppImage
                  source={{ uri: resolveDoctorAvatarUri(doctor, 140) }}
                  fallbackIcon="doctor"
                  className="h-20 w-20 shrink-0 rounded-2xl border border-slate-200 dark:border-slate-700"
                />
                <View className="min-w-0 flex-1">
                  <Text className="text-base font-semibold text-slate-900 dark:text-slate-50" numberOfLines={3}>
                    {doctor.name}
                  </Text>
                  <Text className="mt-1 text-sm text-brand-700 dark:text-brand-300" numberOfLines={3}>
                    {doctor.specialty}
                  </Text>
                  <Text className="mt-1 text-xs text-slate-500 dark:text-slate-400" numberOfLines={2}>
                    Зэрэг: {doctor.title?.trim() || "—"}
                  </Text>
                  <Text className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Ажлын туршлага: {expYears} · Үнэлгээ: {doctorRatingLabel(doctor.id)}
                  </Text>
                </View>
              </View>
              <Text className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {doctor.bio?.trim() ? doctor.bio.trim() : "Танилцуулга бүртгэгдээгүй байна."}
              </Text>
            </Card>
            <Card className="mb-5">
              <Text className="text-sm font-semibold text-slate-900 dark:text-slate-50">Онлайн зөвлөгөө</Text>
              <Text className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                Эмчтэй шууд чатлан зөвлөгөө авахын тулд доорх товчийг дарна уу.
              </Text>
              {chatError ? <Text className="mt-2 text-xs text-rose-600 dark:text-rose-300">{chatError}</Text> : null}
              <View className="mt-3 flex-row flex-wrap gap-2">
                <Button
                  label={chatLoading ? "Түр хүлээнэ үү…" : "Онлайн зөвлөгөө"}
                  className="min-w-[140px] flex-1"
                  disabled={chatLoading}
                  onPress={() => void openChat()}
                />
                <Button
                  label={chatLoading ? "Түр хүлээнэ үү…" : "Чат эхлүүлэх"}
                  variant="outline"
                  className="min-w-[140px] flex-1"
                  disabled={chatLoading}
                  onPress={() => void openChat()}
                />
              </View>
            </Card>

            <Text className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">Үзлэгийн төрөл</Text>
            {services.length === 0 ? (
              <Card className="mb-5 overflow-hidden">
                <EmptyState
                  icon="calendar-remove-outline"
                  title="Үйлчилгээ бүртгэгдээгүй"
                  description="Энэ эмчид одоогоор үзлэгийн төрөл холбогдоогүй байна. Эмнэлгийн админаас лавлана уу."
                />
              </Card>
            ) : (
              <View className="mb-5 gap-3">
                {services.map((svc) => {
                  const st = serviceStatusBadge(svc.kind);
                  return (
                    <Card key={svc.id}>
                      <View className="flex-row flex-wrap items-start justify-between gap-2">
                        <Text
                          className="min-w-0 flex-1 text-base font-semibold text-slate-900 dark:text-slate-50"
                          numberOfLines={4}
                        >
                          {svc.title}
                        </Text>
                        <View className="shrink-0">
                          <Badge label={st.label} tone={st.tone} />
                        </View>
                      </View>
                      <Text className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        Үргэлжлэх хугацаа: {svc.durationMinutes} мин
                      </Text>
                      {svc.kind === "formal" ? (
                        <Text className="mt-1 text-sm font-medium text-brand-700 dark:text-brand-300">
                          {svc.priceMnt.toString()} ₮
                        </Text>
                      ) : (
                        <Text className="mt-1 text-sm font-medium text-brand-600 dark:text-brand-400">Төлбөргүй</Text>
                      )}
                      <View className="mt-3 flex-row flex-wrap gap-2">
                        <Button
                          label="Дэлгэрэнгүй"
                          variant="outline"
                          className="min-w-[140px] flex-1"
                          onPress={() => router.push(`/clinic/${clinicId}/doctor/${doctorId}/service/${svc.id}`)}
                        />
                        <Button
                          label="Цаг авах"
                          className="min-w-[140px] flex-1"
                          onPress={() => router.push(`/clinic/${clinicId}/doctor/${doctorId}/service/${svc.id}`)}
                        />
                      </View>
                    </Card>
                  );
                })}
              </View>
            )}

            <Text className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">Ажлын туршлага</Text>
            <Card className="mb-5">
              <Text className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                {doctor.workExperience?.trim()
                  ? doctor.workExperience.trim()
                  : "Ажлын туршлагын дэлгэрэнгүй мэдээлэл бүртгэгдээгүй байна."}
              </Text>
            </Card>

            <Text className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">Боловсрол</Text>
            <Card className="mb-5">
              <Text className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                {doctor.education?.trim() ? doctor.education.trim() : "Боловсролын мэдээлэл бүртгэгдээгүй байна."}
              </Text>
            </Card>

            <Card className="mb-5">
              <Text className="text-sm font-semibold text-slate-900 dark:text-slate-50">Эрүүл мэндийн зөвлөгөө</Text>
              <Text className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                Нийтлэл, урьдчилан сэргийлэх зөвлөмжүүдийг платформын зөвлөгөөний хэсгээс уншина уу.
              </Text>
              <Button
                label="Зөвлөгөөний хэсэг нээх"
                variant="outline"
                className="mt-4"
                onPress={() => router.push("/(customer)/advice/index")}
              />
            </Card>

            <Card className="mb-5">
              <View className="flex-row items-start justify-between gap-3">
                <View className="min-w-0 flex-1">
                  <Text className="text-sm font-semibold text-slate-900 dark:text-slate-50">Сэтгэгдэл</Text>
                  <Text className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    Үйлчлүүлэгчдийн үнэлгээ, тайлбарыг тусадал хуудаснаас харна уу.
                  </Text>
                </View>
              </View>
              <View className="mt-4 flex-row flex-wrap gap-2">
                <Button
                  label="Сэтгэгдэл харах"
                  variant="outline"
                  className="min-w-[140px] flex-1"
                  onPress={() => router.push(`/clinic/${clinicId}/doctor/${doctorId}/reviews`)}
                />
              </View>
            </Card>

            {doctor.phone?.trim() ? (
              <Button
                label="Эмчтэй утсаар холбогдох"
                variant="outline"
                className="mt-2"
                onPress={() => void Linking.openURL(`tel:${doctor.phone!.replace(/\s/g, "")}`)}
              />
            ) : null}

            <Button
              label="Эмч нар руу буцах"
              variant="ghost"
              className="mt-3"
              onPress={() => router.push(`/clinic/${clinicId}/doctors`)}
            />
          </>
        )}
      </ScreenScrollView>
    </>
  );
}
