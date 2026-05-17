import { AppImage, Button, Card, EmptyState, ErrorState, LoadingState, ScreenScrollView } from "@/components";
import { toFriendlyErrorMn } from "@/lib/friendlyErrorMn";
import { routes } from "@/constants/appRoutes";
import { useAuth } from "@/hooks/useAuth";
import { resolveDoctorAvatarUri } from "@/lib/doctorAvatar";
import { getClinicList, getProviderServiceCategories, getSpotlightDoctors } from "@/services/customerCatalog";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Link, router, Tabs } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import type { MockClinicDetail, MockDoctor } from "@/types/customer";

export default function CustomerHomeScreen() {
  const { user } = useAuth();
  const [clinics, setClinics] = useState<MockClinicDetail[] | null>(null);
  const [clinicsError, setClinicsError] = useState<string | null>(null);
  const [featuredDoctors, setFeaturedDoctors] = useState<MockDoctor[] | null>(null);
  const [serviceCategories, setServiceCategories] = useState<string[] | null>(null);

  useEffect(() => {
    let alive = true;
    setClinicsError(null);
    getClinicList()
      .then((data) => {
        if (alive) setClinics(data);
      })
      .catch((e) => {
        if (alive) {
          setClinics([]);
          setClinicsError(toFriendlyErrorMn(e instanceof Error ? e.message : "Ачааллахад алдаа гарлаа."));
        }
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    getProviderServiceCategories()
      .then((cats) => {
        if (alive) setServiceCategories(cats);
      })
      .catch(() => {
        if (alive) setServiceCategories([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    getSpotlightDoctors(6)
      .then((d) => {
        if (alive) setFeaturedDoctors(d);
      })
      .catch(() => {
        if (alive) setFeaturedDoctors([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  function doctorScoreLabel(id: string): string {
    const n = Number(id.replace(/\D/g, "").slice(-1) || "7");
    return (4.5 + (n % 5) * 0.1).toFixed(1);
  }

  const topClinics = (clinics ?? []).slice(0, 2);

  return (
    <>
      <Tabs.Screen
        options={{
          tabBarLabel: "Нүүр",
          headerTitle: "",
        }}
      />
      <ScreenScrollView
        className="flex-1 bg-slate-50 dark:bg-slate-950"
        contentContainerStyle={{ padding: 16, paddingBottom: 34 }}
      >
        <View className="mb-4 min-w-0">
          <Text className="text-xl font-bold leading-7 text-slate-900 dark:text-slate-50" numberOfLines={2}>
            Сайн байна уу, {user?.name?.trim() || "үйлчлүүлэгч"}!
          </Text>
          <Text className="mt-1.5 text-sm leading-5 text-slate-500 dark:text-slate-400" numberOfLines={2}>
            Өнөөдөр танд ямар тусламж хэрэгтэй вэ?
          </Text>
        </View>

        <Pressable
          onPress={() => router.push(routes.customerSearch)}
          className="mb-6 min-h-[52px] flex-row items-center rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <MaterialCommunityIcons name="magnify" size={20} color="#64748b" />
          <Text className="ml-2 min-w-0 flex-1 text-sm text-slate-500 dark:text-slate-400" numberOfLines={2}>
            Эмч, эмнэлэг, үйлчилгээ хайх
          </Text>
        </Pressable>

        <Link href={routes.customerWallet} asChild>
          <Pressable className="mb-6 flex-row items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm active:opacity-95 dark:border-slate-700 dark:bg-slate-900">
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-900/40">
                <MaterialCommunityIcons name="wallet-outline" size={22} color="#2563eb" />
              </View>
              <View className="min-w-0 flex-1">
                <Text className="text-sm font-bold text-slate-900 dark:text-slate-50">Цахим данс</Text>
                <Text className="mt-0.5 text-xs text-slate-500 dark:text-slate-400" numberOfLines={1}>
                  Төлбөр, цэнэглэлт, гүйлгээ
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color="#94a3b8" />
          </Pressable>
        </Link>

        <View className="mb-6">
          <View className="mb-3 flex-row items-center justify-between gap-3">
            <Text className="min-w-0 flex-1 text-base font-semibold text-slate-900 dark:text-slate-50" numberOfLines={1}>
              Зөвлөгөө
            </Text>
            <Link href={routes.customerAdvice} asChild>
              <Pressable className="shrink-0">
                <Text className="text-xs font-medium text-brand-700 dark:text-brand-300">Бүгдийг харах</Text>
              </Pressable>
            </Link>
          </View>
          <View>
            <Link href={routes.customerFreeConsult} asChild>
              <Pressable className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40">
                  <MaterialCommunityIcons name="video-outline" size={20} color="#2563eb" />
                </View>
                <Text className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-50" numberOfLines={2}>
                  Онлайн зөвлөгөө
                </Text>
                <Text className="mt-1 text-xs leading-4 text-slate-500 dark:text-slate-400" numberOfLines={2}>
                  Шуурхай зөвлөгөө авах
                </Text>
              </Pressable>
            </Link>
          </View>
        </View>

        <View className="mb-6">
          <View className="mb-3 flex-row items-center justify-between gap-3">
            <Text className="min-w-0 flex-1 text-base font-semibold text-slate-900 dark:text-slate-50" numberOfLines={2}>
              Үзлэгийн төрөл
            </Text>
            <Link href={routes.customerAppointments} asChild>
              <Pressable className="shrink-0">
                <Text className="text-xs font-medium text-brand-700 dark:text-brand-300">Бүгдийг харах</Text>
              </Pressable>
            </Link>
          </View>
          <Card className="mb-3">
            <Link href={routes.customerAppointments} asChild>
              <Pressable className="flex-row items-center justify-between gap-3">
                <View className="min-w-0 flex-1">
                  <Text className="text-sm font-semibold text-slate-900 dark:text-slate-50" numberOfLines={2}>
                    Төлбөртэй үзлэг
                  </Text>
                  <Text className="mt-1 text-xs leading-4 text-slate-500 dark:text-slate-400" numberOfLines={2}>
                    Эмнэлэг дээр цаг товлож үзүүлэх
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={22} color="#64748b" />
              </Pressable>
            </Link>
          </Card>
          <Card>
            <Link href={routes.customerFreeConsult} asChild>
              <Pressable className="flex-row items-center justify-between gap-3">
                <View className="min-w-0 flex-1">
                  <Text className="text-sm font-semibold text-slate-900 dark:text-slate-50" numberOfLines={2}>
                    Үнэгүй зөвлөгөө
                  </Text>
                  <Text className="mt-1 text-xs leading-4 text-slate-500 dark:text-slate-400" numberOfLines={2}>
                    Анхан шатны онлайн зөвлөгөө
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={22} color="#64748b" />
              </Pressable>
            </Link>
          </Card>
          <Card className="mt-3">
            <Text className="text-sm font-semibold text-slate-900 dark:text-slate-50">Үйлчилгээний ангиллууд</Text>
            {serviceCategories === null ? (
              <Text className="mt-2 text-xs text-slate-500 dark:text-slate-400">Ачааллаж байна…</Text>
            ) : serviceCategories.length === 0 ? (
              <Text className="mt-2 text-xs text-slate-500 dark:text-slate-400">Үзүүлэгчийн ангилал хараахан бүртгэгдээгүй байна.</Text>
            ) : (
              <View className="mt-3 flex-row flex-wrap gap-2">
                {serviceCategories.slice(0, 10).map((cat) => (
                  <Pressable
                    key={cat}
                    onPress={() => router.push({ pathname: routes.customerSearch, params: { q: cat } })}
                    className="rounded-full border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                  >
                    <Text className="text-xs text-slate-700 dark:text-slate-300">{cat}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </Card>
        </View>

        <View className="mb-6">
          <View className="mb-3 flex-row items-center justify-between gap-3">
            <Text className="min-w-0 flex-1 text-base font-semibold text-slate-900 dark:text-slate-50" numberOfLines={1}>
              Эмнэлэг
            </Text>
            <Link href={routes.customerClinics} asChild>
              <Pressable className="shrink-0">
                <Text className="text-xs font-medium text-brand-700 dark:text-brand-300">Бүгдийг харах</Text>
              </Pressable>
            </Link>
          </View>
          {clinicsError ? (
            <ErrorState
              title="Эмнэлгийн жагсаалт ачаалагдаагүй"
              message={clinicsError}
              onRetry={() => {
                setClinics(null);
                setClinicsError(null);
                void getClinicList()
                  .then((data) => {
                    setClinics(data);
                  })
                  .catch((e) => {
                    setClinics([]);
                    setClinicsError(toFriendlyErrorMn(e instanceof Error ? e.message : "Ачааллахад алдаа гарлаа."));
                  });
              }}
              retryLabel="Дахин оролдох"
            />
          ) : clinics === null ? (
            <Card>
              <LoadingState compact title="Эмнэлгүүдийг ачааллаж байна…" subtitle="Түр хүлээнэ үү." />
            </Card>
          ) : topClinics.length === 0 ? (
            <Card className="overflow-hidden">
              <EmptyState
                icon="hospital-building"
                title="Эмнэлэг олдсонгүй"
                description="Платформд бүртгэлтэй эмнэлэг байхгүй эсвэл одоогоор хоосон байна. Дараа дахин шалгана уу."
                action={{
                  label: "Дахин ачаалах",
                  variant: "outline",
                  onPress: () => {
                    setClinics(null);
                    setClinicsError(null);
                    void getClinicList()
                      .then((data) => setClinics(data))
                      .catch((e) => {
                        setClinics([]);
                        setClinicsError(toFriendlyErrorMn(e instanceof Error ? e.message : "Ачааллахад алдаа гарлаа."));
                      });
                  },
                }}
              />
            </Card>
          ) : (
            <View className="gap-3">
              {topClinics.map((c) => (
                <Link key={c.id} href={`/clinic/${c.id}`} asChild>
                  <Pressable className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <Text className="text-sm font-semibold text-slate-900 dark:text-slate-50" numberOfLines={2}>
                      {c.name}
                    </Text>
                    <Text className="mt-1 text-xs text-slate-500 dark:text-slate-400" numberOfLines={1}>
                      {c.city}
                    </Text>
                    <Text className="mt-2 text-xs text-slate-500 dark:text-slate-400" numberOfLines={2}>
                      {c.description}
                    </Text>
                  </Pressable>
                </Link>
              ))}
            </View>
          )}
        </View>

        <View className="mb-6">
          <View className="mb-3 flex-row items-center justify-between gap-3">
            <Text className="min-w-0 flex-1 text-base font-semibold text-slate-900 dark:text-slate-50" numberOfLines={1}>
              Даатгал
            </Text>
            <Link href={routes.customerInsurance} asChild>
              <Pressable className="shrink-0">
                <Text className="text-xs font-medium text-brand-700 dark:text-brand-300">Бүгдийг харах</Text>
              </Pressable>
            </Link>
          </View>
          <Card>
            <Link href={routes.customerInsurance} asChild>
              <Pressable className="flex-row items-center justify-between gap-3">
                <View className="min-w-0 flex-1">
                  <Text className="text-sm font-semibold text-slate-900 dark:text-slate-50" numberOfLines={2}>
                    ЭМД мэдээлэл шалгах
                  </Text>
                  <Text className="mt-1 text-xs leading-4 text-slate-500 dark:text-slate-400" numberOfLines={2}>
                    Эрхийн мэдээлэл, хамрах үйлчилгээ харах
                  </Text>
                </View>
                <MaterialCommunityIcons name="shield-check-outline" size={22} color="#2563eb" />
              </Pressable>
            </Link>
          </Card>
        </View>

        <View>
          <View className="mb-3 flex-row items-center justify-between gap-3">
            <Text className="min-w-0 flex-1 text-base font-semibold text-slate-900 dark:text-slate-50" numberOfLines={2}>
              Онцлох эмч нар
            </Text>
            <Link href={routes.customerDoctors} asChild>
              <Pressable className="shrink-0">
                <Text className="text-xs font-medium text-brand-700 dark:text-brand-300">Бүгдийг харах</Text>
              </Pressable>
            </Link>
          </View>
          <View className="gap-3">
            {featuredDoctors === null ? (
              <Card>
                <LoadingState compact title="Онцлох эмч нарыг ачааллаж байна…" />
              </Card>
            ) : featuredDoctors.length === 0 ? (
              <Card className="overflow-hidden">
                <EmptyState
                  icon="doctor"
                  title="Онцлох эмч алга"
                  description="Одоогоор бүртгэлтэй эмч харагдахгүй байна. Эмнэлгээс сонгон үзлэг захиална уу."
                  action={{ label: "Эмнэлгүүд", onPress: () => router.push(routes.customerClinics), variant: "outline" }}
                />
              </Card>
            ) : (
              featuredDoctors.map((doctor) => (
                <Link key={doctor.id} href={`/clinic/${doctor.clinicId}/doctor/${doctor.id}`} asChild>
                  <Pressable className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <View className="flex-row items-center justify-between gap-3">
                      <AppImage
                        source={{ uri: resolveDoctorAvatarUri(doctor, 72) }}
                        fallbackIcon="account-circle-outline"
                        className="h-12 w-12 rounded-2xl border border-slate-200 dark:border-slate-700"
                      />
                      <View className="min-w-0 flex-1">
                        <Text className="text-sm font-semibold text-slate-900 dark:text-slate-50" numberOfLines={1}>
                          {doctor.name}
                        </Text>
                        <Text className="mt-1 text-xs text-slate-500 dark:text-slate-400" numberOfLines={2}>
                          {doctor.specialty}
                        </Text>
                      </View>
                      <View className="flex-row items-center rounded-full bg-amber-100 px-2 py-1 dark:bg-amber-900/40">
                        <MaterialCommunityIcons name="star" size={12} color="#f59e0b" />
                        <Text className="ml-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
                          {doctorScoreLabel(doctor.id)}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                </Link>
              ))
            )}
          </View>
        </View>
      </ScreenScrollView>
    </>
  );
}
