import { Button, Card, EmptyState, ErrorState, LoadingState, ScreenScrollView, SectionHeader } from "@/components";
import { routes } from "@/constants/appRoutes";
import { ApiError } from "@/lib/api/client";
import { consultationApi, type FreeConsultDoctorAvailability } from "@/services/api/consultationApi";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, Stack, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, RefreshControl, Text, View } from "react-native";

export default function FreeConsultDoctorsScreen() {
  const [items, setItems] = useState<FreeConsultDoctorAvailability[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await consultationApi.listFreeAvailability();
      setItems(data.items);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Ачааллахад алдаа гарлаа.");
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  return (
    <>
      <Stack.Screen options={{ title: "Үнэгүй зөвлөгөө" }} />
      <ScreenScrollView
        className="flex-1 bg-app-bg"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}
      >
        <SectionHeader
          title="Үнэгүй зөвлөгөө"
          subtitle="Үнэгүй зөвлөгөөний цаг нээсэн эмчээс сонгоно уу."
        />

        {error ? (
          <ErrorState className="mb-4" title="Ачаалахад алдаа" message={error} onRetry={() => void load()} />
        ) : null}

        {loading && items === null ? (
          <Card>
            <LoadingState compact title="Эмч нарыг ачааллаж байна…" />
          </Card>
        ) : items && items.length === 0 ? (
          <Card className="overflow-hidden">
            <EmptyState
              icon="doctor"
              title="Боломжит эмч алга"
              description="Одоогоор үнэгүй зөвлөгөөний цаг нээсэн эмч байхгүй байна. Дараа дахин шалгана уу."
              action={{ label: "Нүүр рүү", variant: "outline", onPress: () => router.push(routes.customerHome) }}
            />
          </Card>
        ) : (
          <View className="gap-3">
            {(items ?? []).map((doc) => (
              <Pressable
                key={doc.doctor_id}
                onPress={() =>
                  router.push({
                    pathname: "/(customer)/free-consult/book",
                    params: {
                      doctorId: String(doc.doctor_id),
                      clinicId: String(doc.clinic_id),
                      doctorName: doc.doctor_name,
                      clinicName: doc.clinic_name,
                    },
                  })
                }
                className="active:opacity-95"
              >
                <Card className="border border-app-border">
                  <View className="flex-row items-center gap-3">
                    <View className="h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
                      <MaterialCommunityIcons name="account-tie" size={26} color="#059669" />
                    </View>
                    <View className="min-w-0 flex-1">
                      <Text className="text-base font-bold text-app-text">{doc.doctor_name}</Text>
                      {doc.specialty ? (
                        <Text className="mt-0.5 text-xs text-app-text-muted">{doc.specialty}</Text>
                      ) : null}
                      <Text className="mt-1 text-xs text-app-text-secondary">{doc.clinic_name}</Text>
                      <Text className="mt-2 text-xs font-semibold text-brand-600 dark:text-brand-400">
                        {doc.slots.length} боломжит цаг
                      </Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={22} color="#94a3b8" />
                  </View>
                </Card>
              </Pressable>
            ))}
          </View>
        )}

        <Button label="Буцах" variant="ghost" className="mt-8" onPress={() => router.back()} />
      </ScreenScrollView>
    </>
  );
}
