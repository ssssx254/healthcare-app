import { Button, Card, EmptyState, ErrorState, LoadingState, ScreenScrollView, SectionHeader } from "@/components";

import { routes } from "@/constants/appRoutes";

import { useChatSync } from "@/hooks/useChatSync";

import { ApiError } from "@/lib/api/client";

import { consultationApi, type FreeConsultDoctorAvailability } from "@/services/api/consultationApi";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import { router, Stack, useFocusEffect } from "expo-router";

import { useCallback, useState } from "react";

import { Pressable, RefreshControl, Text, View } from "react-native";



function slotDayCount(slots: { slot_date: string }[]): number {

  return new Set(slots.map((s) => s.slot_date)).size;

}



export default function FreeConsultDoctorsScreen() {

  const { ensureCustomerConversation } = useChatSync();

  const [items, setItems] = useState<FreeConsultDoctorAvailability[] | null>(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [chatDoctorId, setChatDoctorId] = useState<number | null>(null);

  const [chatError, setChatError] = useState<string | null>(null);



  const load = useCallback(async (opts?: { showLoading?: boolean }) => {

    setError(null);

    if (opts?.showLoading !== false) setLoading(true);

    try {

      const data = await consultationApi.listFreeAvailability(undefined, { skipCache: true });

      setItems(data.items);

    } catch (e) {

      setError(e instanceof ApiError ? e.message : "Ачааллахад алдаа гарлаа.");

      setItems([]);

    } finally {

      setLoading(false);

      setRefreshing(false);

    }

  }, []);



  const onRefresh = useCallback(() => {

    setRefreshing(true);

    void load({ showLoading: false });

  }, [load]);



  useFocusEffect(

    useCallback(() => {

      setLoading(true);

      void load();

    }, [load]),

  );



  const openChat = async (clinicId: number, doctorId: number, doctorName: string) => {

    setChatError(null);

    setChatDoctorId(doctorId);

    try {

      const conversationId = await ensureCustomerConversation({ clinicId, providerDisplayName: doctorName });

      router.push({
        pathname: routes.customerChatDetail,
        params: { conversationId, providerName: doctorName },
      });

    } catch (e) {

      setChatError(e instanceof ApiError ? e.message : "Чат нээх үед алдаа гарлаа.");

    } finally {

      setChatDoctorId(null);

    }

  };



  return (

    <>

      <Stack.Screen

        options={{

          title: "Үнэгүй зөвлөгөө",

          headerRight: () => (

            <Pressable

              onPress={onRefresh}

              disabled={loading || refreshing}

              accessibilityRole="button"

              accessibilityLabel="Шинэчлэх"

              className="mr-2 rounded-full p-2 active:opacity-70"

            >

              <MaterialCommunityIcons

                name="refresh"

                size={22}

                color={loading || refreshing ? "#94a3b8" : "#2563eb"}

              />

            </Pressable>

          ),

        }}

      />

      <ScreenScrollView

        className="flex-1 bg-app-bg"

        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}

        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}

      >

        <SectionHeader

          title="Үнэгүй зөвлөгөө"

          subtitle="Үнэгүй зөвлөгөөний цаг нээсэн эмчээс сонгоно уу."

        />



        {error ? (

          <ErrorState className="mb-4" title="Ачаалахад алдаа" message={error} onRetry={() => void load()} />

        ) : null}

        {chatError ? (

          <Card className="mb-4 border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/30">

            <Text className="text-sm text-rose-700 dark:text-rose-300">{chatError}</Text>

          </Card>

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

              description="Provider талд «Үнэгүй зөвлөгөө» төрлийн цаг нэмсэн эсэхээ шалгаад дахин шинэчилнэ үү."

              action={{

                label: refreshing || loading ? "Шинэчлэж байна…" : "Шинэчлэх",

                onPress: onRefresh,

              }}

            />

          </Card>

        ) : (

          <View className="gap-3">

            {(items ?? []).map((doc) => {

              const days = slotDayCount(doc.slots);

              return (

                <Card key={doc.doctor_id} className="border border-app-border">

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

                        {days} өдөр · {doc.slots.length} цаг

                      </Text>

                    </View>

                  </View>

                  <View className="mt-4 flex-row flex-wrap gap-2">

                    <Button

                      label="Цаг захиалах"

                      className="min-w-[140px] flex-1 self-auto"

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

                    />

                    <Button

                      label={chatDoctorId === doc.doctor_id ? "Нээж байна…" : "Чатлах"}

                      variant="outline"

                      className="min-w-[120px] flex-1 self-auto"

                      disabled={chatDoctorId === doc.doctor_id}

                      onPress={() => void openChat(doc.clinic_id, doc.doctor_id, doc.doctor_name)}

                    />

                  </View>

                </Card>

              );

            })}

          </View>

        )}



        <Button label="Буцах" variant="ghost" className="mt-8 self-auto" onPress={() => router.back()} />

      </ScreenScrollView>

    </>

  );

}


