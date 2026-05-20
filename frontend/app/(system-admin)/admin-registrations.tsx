import { Badge, Button, Card, Input, ScreenScrollView, SectionHeader } from "@/components";
import { adminApi, type PendingProviderRegistrationRow } from "@/services/api/adminApi";
import { ApiError } from "@/lib/api/client";
import { Tabs } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

function formatSubmittedAt(row: PendingProviderRegistrationRow): string {
  const raw = row.submission_created_at || row.user_created_at;
  if (!raw) return "—";
  try {
    return new Date(raw).toLocaleString("mn-MN", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return String(raw);
  }
}

export default function AdminRegistrationsScreen() {
  const [queue, setQueue] = useState<PendingProviderRegistrationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [rejectingForId, setRejectingForId] = useState<number | null>(null);
  const [rejectFeedback, setRejectFeedback] = useState("");

  const load = useCallback(async () => {
    setFormError(null);
    setLoading(true);
    try {
      const rows = await adminApi.listPendingProviderRegistrations();
      setQueue(rows);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Ачаалахад алдаа гарлаа.";
      setFormError(msg);
      setQueue([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onApprove = async (providerUserId: number) => {
    setFormError(null);
    setActionId(providerUserId);
    try {
      await adminApi.reviewProviderRegistration(providerUserId, { decision: "approved" });
      await load();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Алдаа гарлаа.";
      setFormError(msg);
    } finally {
      setActionId(null);
    }
  };

  const onRejectSubmit = async (providerUserId: number) => {
    const fb = rejectFeedback.trim();
    if (fb.length < 3) {
      setFormError("Татгалзах шалтгаанаа дор хаяж 3 тэмдэгтээр бичнэ үү.");
      return;
    }
    setFormError(null);
    setActionId(providerUserId);
    try {
      await adminApi.reviewProviderRegistration(providerUserId, { decision: "rejected", feedback: fb });
      setRejectingForId(null);
      setRejectFeedback("");
      await load();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Алдаа гарлаа.";
      setFormError(msg);
    } finally {
      setActionId(null);
    }
  };

  return (
    <>
      <Tabs.Screen options={{ title: "Бүртгэл хяналт" }} />
      <ScreenScrollView className="flex-1 bg-app-bg" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <SectionHeader
          title="Үзүүлэгчийн бүртгэл батлах"
          subtitle="Шинээр бүртгэсэн үйлчилгээ үзүүлэгчдийг баталгаажуулж, эмнэлгийн мэдээллийг үүсгэнэ (илгээлт байвал)."
        />

        {formError ? (
          <Card className="mb-4 border border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/40">
            <Text className="text-sm text-rose-800 dark:text-rose-200">{formError}</Text>
          </Card>
        ) : null}

        {loading ? (
          <View className="items-center py-10">
            <ActivityIndicator size="large" />
            <Text className="mt-3 text-sm text-app-text-muted">Ачааллаж байна…</Text>
          </View>
        ) : queue.length === 0 ? (
          <Card>
            <Text className="text-center text-sm text-app-text-secondary">
              Хүлээгдэж буй үзүүлэгчийн бүртгэл одоогоор алга.
            </Text>
            <Button label="Дахин ачаалах" variant="outline" className="mt-4" onPress={() => void load()} />
          </Card>
        ) : (
          <View className="gap-3">
            {queue.map((item) => {
              const id = item.provider_user_id;
              const hasSubmission = item.submission_id != null;
              const title = item.clinic_name?.trim() || "Илгээсэн эмнэлгийн нэргүй";
              const busy = actionId === id;
              const rejecting = rejectingForId === id;

              return (
                <Card key={String(id)}>
                  <View className="flex-row items-center justify-between gap-2">
                    <Text className="min-w-0 flex-1 text-base font-semibold text-app-text" numberOfLines={2}>
                      {title}
                    </Text>
                    <Badge label="Хүлээгдэж буй" tone="warning" />
                  </View>
                  <Text className="mt-1 text-xs text-app-text-muted">
                    Эзэмшигч: {item.provider_full_name} · {item.provider_email}
                  </Text>
                  <Text className="mt-1 text-xs text-app-text-muted">
                    {item.city ? `${item.city}${item.district ? ` · ${item.district}` : ""}` : "Байршил оруулаагүй"}
                  </Text>
                  <Text className="mt-1 text-xs text-app-text-muted">
                    Илгээсэн: {formatSubmittedAt(item)}
                    {hasSubmission ? "" : " · Анхаар: API-р илгээлт хадгалагдаагүй (зөвхөн хэрэглэгч pending)."}
                  </Text>

                  {rejecting ? (
                    <View className="mt-3">
                      <Input
                        label="Татгалзах шалтгаан"
                        value={rejectFeedback}
                        onChangeText={setRejectFeedback}
                        placeholder="Заавал бичнэ үү"
                        multiline
                      />
                      <View className="mt-3 flex-row gap-2">
                        <Button
                          label="Буцах"
                          variant="outline"
                          className="flex-1"
                          disabled={busy}
                          onPress={() => {
                            setRejectingForId(null);
                            setRejectFeedback("");
                            setFormError(null);
                          }}
                        />
                        <Button
                          label="Татгалзах"
                          variant="secondary"
                          className="flex-1"
                          loading={busy}
                          disabled={busy}
                          onPress={() => void onRejectSubmit(id)}
                        />
                      </View>
                    </View>
                  ) : (
                    <View className="mt-3 flex-row gap-2">
                      <Button
                        label="Батлах"
                        className="flex-1"
                        loading={busy}
                        disabled={busy || rejectingForId !== null}
                        onPress={() => void onApprove(id)}
                      />
                      <Button
                        label="Татгалзах"
                        variant="secondary"
                        className="flex-1"
                        disabled={busy || rejectingForId !== null}
                        onPress={() => {
                          setRejectingForId(id);
                          setRejectFeedback("");
                          setFormError(null);
                        }}
                      />
                    </View>
                  )}
                </Card>
              );
            })}
            <Button label="Жагсаалт шинэчлэх" variant="outline" onPress={() => void load()} />
          </View>
        )}
      </ScreenScrollView>
    </>
  );
}
