import {
  AppImage,
  Badge,
  Button,
  Card,
  DoctorReviewForm,
  EmptyState,
  LoadingState,
  ScreenScrollView,
  StarRating,
} from "@/components";
import { adviceArticles } from "@/data/healthcare/adviceArticles";
import { routes } from "@/constants/appRoutes";
import { orderStatusLabel } from "@/constants/orderStatus";
import { useCustomerBooking } from "@/contexts/CustomerBookingContext";
import { useChatSync } from "@/hooks/useChatSync";
import { formatDoctorRatingCount, formatDoctorRatingLabel } from "@/lib/formatDoctorRating";
import { resolveDoctorAvatarUri } from "@/lib/doctorAvatar";
import { doctorReviewApi, type DoctorReviewRow, type DoctorReviewViewer } from "@/services/api/doctorReviewApi";
import { getClinicById, getDoctor, getServicesByDoctor } from "@/services/customerCatalog";
import { cn } from "@/utils/cn";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Link, router, useLocalSearchParams, useNavigation } from "expo-router";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import type { MockClinicDetail, MockDoctor, MockService } from "@/types/customer";

type TabId = "about" | "articles";

function serviceStatusBadge(kind: MockService["kind"]) {
  if (kind === "free_online") return { label: orderStatusLabel.free_consult, tone: "success" as const };
  return { label: orderStatusLabel.payment_required, tone: "warning" as const };
}

function formatReviewDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("mn-MN", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

export default function DoctorDetailScreen() {
  const navigation = useNavigation();
  const { clinicId, doctorId, reviewBookingId } = useLocalSearchParams<{
    clinicId: string;
    doctorId: string;
    reviewBookingId?: string;
  }>();
  const { setDraftClinic, setDraftDoctor } = useCustomerBooking();
  const { ensureCustomerConversation } = useChatSync();
  const [clinic, setClinic] = useState<MockClinicDetail | null | undefined>(undefined);
  const [doctor, setDoctor] = useState<MockDoctor | null | undefined>(undefined);
  const [services, setServices] = useState<MockService[] | null>(null);
  const [tab, setTab] = useState<TabId>("about");
  const [reviews, setReviews] = useState<DoctorReviewRow[]>([]);
  const [reviewSummary, setReviewSummary] = useState<{ average_rating: number | null; review_count: number } | null>(null);
  const [viewer, setViewer] = useState<DoctorReviewViewer | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(Boolean(reviewBookingId));
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const loadReviews = useCallback(async () => {
    if (!doctorId) return;
    setReviewsLoading(true);
    try {
      const res = await doctorReviewApi.list(doctorId, { page: 1, page_size: 20 });
      setReviews(res.items);
      setReviewSummary(res.summary);
      setViewer(res.viewer);
    } catch {
      setReviews([]);
      setReviewSummary(null);
      setViewer({
        can_submit: false,
        booking_id: null,
        message: "Зөвхөн үзлэгт хамрагдсан хэрэглэгч үнэлгээ өгөх боломжтой.",
      });
    } finally {
      setReviewsLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    if (!clinicId) return;
    let alive = true;
    getClinicById(String(clinicId)).then((c) => {
      if (!alive) return;
      setClinic(c ?? null);
      if (c) setDraftClinic(c.id, c.name);
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

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    if (reviewBookingId && viewer?.can_submit) {
      setShowReviewForm(true);
    }
  }, [reviewBookingId, viewer?.can_submit]);

  const displayRating = reviewSummary?.average_rating ?? doctor?.averageRating ?? null;
  const displayCount = reviewSummary?.review_count ?? doctor?.reviewCount ?? 0;
  const reviewBookingIdNum = reviewBookingId ? Number(reviewBookingId) : viewer?.booking_id ?? null;

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

  const firstFormalService = services?.find((s) => s.kind === "formal");

  useLayoutEffect(() => {
    navigation.setOptions({ title: doctor?.name ?? "Эмч" });
  }, [navigation, doctor?.name]);

  return (
    <ScreenScrollView
        className="flex-1 bg-app-bg"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      >
        {doctor === undefined || services === null ? (
          <Card>
            <LoadingState compact title="Эмчийн мэдээлэл ачааллаж байна…" />
          </Card>
        ) : doctor == null ? (
          <Card className="overflow-hidden">
            <EmptyState
              icon="account-question-outline"
              title="Эмч олдсонгүй"
              description="Эмнэлгийн жагсаалтаас дахин сонгоно уу."
              action={{
                label: "Эмч нар руу",
                onPress: () => router.push(`/clinic/${clinicId}/doctors`),
                variant: "outline",
              }}
            />
          </Card>
        ) : (
          <>
            <Card className="mb-4 border-0 bg-app-card py-6 shadow-md">
              <View className="items-center">
                <AppImage
                  source={{ uri: resolveDoctorAvatarUri(doctor, 160) }}
                  fallbackIcon="doctor"
                  className="h-28 w-28 rounded-full border-4 border-app-border bg-app-muted"
                />
                <Text className="mt-4 text-center text-xl font-bold text-app-text">{doctor.name}</Text>
                <Text className="mt-1 text-center text-sm font-medium text-brand-600 dark:text-brand-400">
                  {doctor.specialty}
                </Text>
                {doctor.title ? (
                  <Text className="mt-0.5 text-center text-xs text-app-text-muted">{doctor.title}</Text>
                ) : null}
                <Text className="mt-2 text-center text-xs text-app-text-muted">
                  {doctor.experienceYears != null ? `${doctor.experienceYears} жилийн туршлага` : "Туршлага бүртгэгдээгүй"}
                </Text>
                <View className="mt-3 flex-row items-center gap-2">
                  <StarRating value={displayRating ?? 0} size={18} />
                  <Text className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                    {displayRating != null ? formatDoctorRatingLabel({ averageRating: displayRating, reviewCount: displayCount }) : "Шинэ"}
                  </Text>
                  <Text className="text-xs text-app-text-muted">({formatDoctorRatingCount({ reviewCount: displayCount })})</Text>
                </View>
              </View>
              <View className="mt-5 w-full gap-2">
                <Button
                  label={chatLoading ? "Түр хүлээнэ үү…" : "Онлайн зөвлөгөө авах"}
                  className="w-full"
                  disabled={chatLoading}
                  onPress={() => void openChat()}
                />
                {chatError ? <Text className="text-xs text-red-600 dark:text-red-400">{chatError}</Text> : null}
                {firstFormalService ? (
                  <Button
                    label="Цаг захиалах"
                    variant="outline"
                    className="w-full"
                    onPress={() =>
                      router.push(`/clinic/${clinicId}/doctor/${doctorId}/service/${firstFormalService.id}`)
                    }
                  />
                ) : null}
              </View>
            </Card>

            <View className="mb-4 flex-row rounded-2xl border border-app-border bg-app-muted p-1">
              {(["about", "articles"] as TabId[]).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setTab(t)}
                  className={cn(
                    "flex-1 items-center rounded-xl py-2.5",
                    tab === t ? "bg-app-card shadow-sm" : "",
                  )}
                >
                  <Text
                    className={cn(
                      "text-sm font-bold",
                      tab === t ? "text-brand-600 dark:text-brand-300" : "text-app-text-muted",
                    )}
                  >
                    {t === "about" ? "Тухай" : "Нийтлэл"}
                  </Text>
                </Pressable>
              ))}
            </View>

            {tab === "about" ? (
              <>
                <Text className="mb-2 text-sm font-semibold text-app-text">Танилцуулга</Text>
                <Card className="mb-4">
                  <Text className="text-sm leading-6 text-app-text-secondary">
                    {doctor.bio?.trim() || "Танилцуулга бүртгэгдээгүй байна."}
                  </Text>
                </Card>

                <Text className="mb-2 text-sm font-semibold text-app-text">Боловсрол</Text>
                <Card className="mb-4">
                  <Text className="text-sm leading-6 text-app-text-secondary">
                    {doctor.education?.trim() || "Боловсролын мэдээлэл бүртгэгдээгүй байна."}
                  </Text>
                </Card>

                <Text className="mb-2 text-sm font-semibold text-app-text">Ажлын туршлага</Text>
                <Card className="mb-4">
                  <Text className="text-sm leading-6 text-app-text-secondary">
                    {doctor.workExperience?.trim() || "Ажлын туршлагын мэдээлэл бүртгэгдээгүй байна."}
                  </Text>
                </Card>

                <Text className="mb-2 text-sm font-semibold text-app-text">Эмнэлэг</Text>
                <Card className="mb-4">
                  <Text className="text-base font-semibold text-app-text">{clinic?.name ?? "—"}</Text>
                  {clinic?.address ? (
                    <Text className="mt-1 text-sm text-app-text-secondary">{clinic.address}</Text>
                  ) : null}
                  {clinic?.phone ? (
                    <Text className="mt-1 text-sm text-app-text-muted">{clinic.phone}</Text>
                  ) : null}
                </Card>

                <Text className="mb-2 text-sm font-semibold text-app-text">Үйлчилгээ</Text>
                {services.length === 0 ? (
                  <Card className="mb-4">
                    <EmptyState icon="calendar-remove-outline" title="Үйлчилгээ бүртгэгдээгүй" description="" />
                  </Card>
                ) : (
                  <View className="mb-4 gap-3">
                    {services.map((svc) => {
                      const st = serviceStatusBadge(svc.kind);
                      return (
                        <Card key={svc.id}>
                          <View className="flex-row flex-wrap items-start justify-between gap-2">
                            <Text className="min-w-0 flex-1 text-base font-semibold text-app-text">{svc.title}</Text>
                            <Badge label={st.label} tone={st.tone} />
                          </View>
                          {svc.kind === "formal" ? (
                            <Text className="mt-2 text-sm font-medium text-brand-700 dark:text-brand-300">
                              {svc.priceMnt.toLocaleString("mn-MN")} ₮
                            </Text>
                          ) : (
                            <Text className="mt-2 text-sm text-brand-600">Төлбөргүй</Text>
                          )}
                          <Button
                            label="Цаг авах"
                            variant="outline"
                            className="mt-3"
                            onPress={() =>
                              router.push(`/clinic/${clinicId}/doctor/${doctorId}/service/${svc.id}`)
                            }
                          />
                        </Card>
                      );
                    })}
                  </View>
                )}

                <Text className="mb-2 text-sm font-semibold text-app-text">Үнэлгээний хураангуй</Text>
                <Card className="mb-4">
                  <View className="flex-row items-center gap-3">
                    <Text className="text-3xl font-bold text-app-text">
                      {displayRating != null ? displayRating.toFixed(1) : "—"}
                    </Text>
                    <View>
                      <StarRating value={displayRating ?? 0} />
                      <Text className="mt-1 text-xs text-app-text-muted">{formatDoctorRatingCount({ reviewCount: displayCount })}</Text>
                    </View>
                  </View>
                </Card>

                {viewer?.can_submit && reviewBookingIdNum && showReviewForm ? (
                  <View className="mb-4">
                    <DoctorReviewForm
                      doctorId={String(doctorId)}
                      bookingId={reviewBookingIdNum}
                      onSuccess={() => {
                        setShowReviewForm(false);
                        void loadReviews();
                        void getDoctor(String(clinicId), String(doctorId)).then((d) => setDoctor(d ?? null));
                      }}
                      onCancel={() => setShowReviewForm(false)}
                    />
                  </View>
                ) : viewer?.can_submit && reviewBookingIdNum && !showReviewForm ? (
                  <Button
                    label="Үнэлгээ өгөх"
                    className="mb-4"
                    onPress={() => setShowReviewForm(true)}
                  />
                ) : viewer?.message ? (
                  <Card className="mb-4 border-app-border bg-app-muted">
                    <Text className="text-center text-sm text-app-text-secondary">{viewer.message}</Text>
                  </Card>
                ) : null}

                <Text className="mb-2 text-sm font-semibold text-app-text">Сэтгэгдэлүүд</Text>
                {reviewsLoading ? (
                  <Card className="mb-4">
                    <LoadingState compact title="Сэтгэгдэл ачааллаж байна…" />
                  </Card>
                ) : reviews.length === 0 ? (
                  <Card className="mb-4">
                    <Text className="text-center text-sm text-app-text-muted">Одоогоор сэтгэгдэл байхгүй байна.</Text>
                  </Card>
                ) : (
                  <View className="mb-4 gap-3">
                    {reviews.map((r) => (
                      <Card key={r.id}>
                        <View className="flex-row items-center justify-between gap-2">
                          <Text className="text-sm font-semibold text-app-text">{r.customer_name ?? "Үйлчлүүлэгч"}</Text>
                          <Text className="text-xs text-app-text-muted">{formatReviewDate(r.created_at)}</Text>
                        </View>
                        <View className="mt-2">
                          <StarRating value={r.rating} size={16} />
                        </View>
                        {r.comment ? (
                          <Text className="mt-2 text-sm leading-5 text-app-text-secondary">{r.comment}</Text>
                        ) : null}
                      </Card>
                    ))}
                  </View>
                )}
              </>
            ) : (
              <Card className="mb-4">
                <View className="flex-row gap-3">
                  <MaterialCommunityIcons name="book-open-page-variant-outline" size={28} color="#2563eb" />
                  <View className="min-w-0 flex-1">
                    <Text className="text-base font-bold text-app-text">Эрүүл мэндийн зөвлөгөө</Text>
                    <Text className="mt-2 text-sm leading-6 text-app-text-secondary">
                      Урьдчилан сэргийлэх зөвлөмж, нийтлэлүүдийг платформын зөвлөгөөний хэсгээс уншина уу.
                    </Text>
                    <Button
                      label="Зөвлөгөөний хэсэг нээх"
                      variant="outline"
                      className="mt-4 w-full"
                      onPress={() => router.push(routes.customerAdvice)}
                    />
                  </View>
                </View>
              </Card>
            )}
          </>
        )}
      </ScreenScrollView>
  );
}
