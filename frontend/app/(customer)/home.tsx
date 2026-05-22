import { AppImage, Card, EmptyState, ErrorState, LoadingState, ScreenScrollView, ServiceCategorySection } from "@/components";
import { toFriendlyErrorMn } from "@/lib/friendlyErrorMn";
import { routes } from "@/constants/appRoutes";
import { useAuth } from "@/hooks/useAuth";
import { formatDoctorRatingLabel } from "@/lib/formatDoctorRating";
import { resolveClinicLogoUri } from "@/lib/clinicLogo";
import { resolveDoctorAvatarUri } from "@/lib/doctorAvatar";
import { getClinicList, getSpotlightDoctors } from "@/services/customerCatalog";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Link, router, Tabs, useFocusEffect } from "expo-router";
import type { ComponentProps } from "react";
import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import type { MockClinicDetail, MockDoctor } from "@/types/customer";

type VisitCardProps = {
  href: string;
  title: string;
  subtitle: string;
  icon: ComponentProps<typeof MaterialCommunityIcons>["name"];
  iconColor: string;
  accent: string;
};

function VisitTypeCard({ href, title, subtitle, icon, iconColor, accent }: VisitCardProps) {
  return (
    <Link href={href as never} asChild>
      <Pressable className="flex-row items-center justify-between gap-3 rounded-2xl border px-4 py-4 shadow-sm active:opacity-95 border-app-border bg-app-card">
        <View className="flex-row items-center gap-3 min-w-0 flex-1">
          <View className={`h-12 w-12 items-center justify-center rounded-xl ${accent}`}>
            <MaterialCommunityIcons name={icon} size={24} color={iconColor} />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-sm font-bold text-app-text" numberOfLines={2}>
              {title}
            </Text>
            <Text className="mt-1 text-xs leading-4 text-app-text-muted" numberOfLines={2}>
              {subtitle}
            </Text>
          </View>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={22} color="#94a3b8" />
      </Pressable>
    </Link>
  );
}

export default function CustomerHomeScreen() {
  const { user } = useAuth();
  const [clinics, setClinics] = useState<MockClinicDetail[] | null>(null);
  const [clinicsError, setClinicsError] = useState<string | null>(null);
  const [featuredDoctors, setFeaturedDoctors] = useState<MockDoctor[] | null>(null);

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

  const loadFeaturedDoctors = useCallback(() => {
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

  useFocusEffect(loadFeaturedDoctors);

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
        className="flex-1 bg-app-bg"
        contentContainerStyle={{ padding: 16, paddingBottom: 34 }}
      >
        <View className="mb-4 min-w-0">
          <Text className="text-xl font-bold leading-7 text-app-text" numberOfLines={2}>
            Сайн байна уу, {user?.name?.trim() || "үйлчлүүлэгч"}!
          </Text>
          <Text className="mt-1.5 text-sm leading-5 text-app-text-muted" numberOfLines={2}>
            Өнөөдөр танд ямар тусламж хэрэгтэй вэ?
          </Text>
        </View>

        <Pressable
          onPress={() => router.push(routes.customerSearch)}
          className="mb-6 min-h-[52px] flex-row items-center rounded-2xl px-4 py-3.5 shadow-sm border-app-border bg-app-card"
        >
          <MaterialCommunityIcons name="magnify" size={20} color="#64748b" />
          <Text className="ml-2 min-w-0 flex-1 text-sm text-app-text-muted" numberOfLines={2}>
            Эмч, эмнэлэг, үйлчилгээ хайх
          </Text>
        </Pressable>

        <Link href={routes.customerWallet} asChild>
          <Pressable className="mb-6 flex-row items-center justify-between gap-3 rounded-2xl px-4 py-3.5 shadow-sm active:opacity-95 border-app-border bg-app-card">
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-900/40">
                <MaterialCommunityIcons name="wallet-outline" size={22} color="#2563eb" />
              </View>
              <View className="min-w-0 flex-1">
                <Text className="text-sm font-bold text-app-text">Цахим данс</Text>
                <Text className="mt-0.5 text-xs text-app-text-muted" numberOfLines={1}>
                  Төлбөр, цэнэглэлт, гүйлгээ
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color="#94a3b8" />
          </Pressable>
        </Link>

        <View className="mb-6">
          <View className="mb-3 flex-row items-center justify-between gap-3">
            <Text className="min-w-0 flex-1 text-base font-semibold text-app-text" numberOfLines={2}>
              Үзлэгийн төрөл
            </Text>
            <Link href={routes.customerAppointments} asChild>
              <Pressable className="shrink-0">
                <Text className="text-xs font-medium text-brand-700 dark:text-brand-300">Бүгдийг харах</Text>
              </Pressable>
            </Link>
          </View>
          <View className="gap-3">
            <VisitTypeCard
              href={routes.customerClinics}
              title="Төлбөртэй үзлэг"
              subtitle="Эмнэлэг дээр цаг товлож үзүүлэх"
              icon="calendar-check-outline"
              iconColor="#2563eb"
              accent="bg-brand-100 dark:bg-brand-900/40"
            />
            <VisitTypeCard
              href={routes.customerFreeConsult}
              title="Үнэгүй зөвлөгөө"
              subtitle="Онлайн — эмч сонгож цаг захиалах"
              icon="video-outline"
              iconColor="#059669"
              accent="bg-emerald-50 dark:bg-emerald-950/40"
            />
          </View>
          <Card className="mt-3 p-4">
            <ServiceCategorySection />
          </Card>
        </View>

        <View className="mb-6">
          <View className="mb-3 flex-row items-center justify-between gap-3">
            <Text className="min-w-0 flex-1 text-base font-semibold text-app-text" numberOfLines={1}>
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
                  <Pressable className="rounded-2xl p-4 shadow-sm border-app-border bg-app-card active:opacity-95">
                    <View className="flex-row items-start gap-3">
                      <AppImage
                        source={{ uri: resolveClinicLogoUri(c, 64) }}
                        fallbackIcon="hospital-building"
                        className="h-10 w-10 shrink-0 rounded-xl border border-app-border"
                      />
                      <View className="min-w-0 flex-1">
                        <Text className="text-sm font-semibold text-app-text" numberOfLines={2}>
                          {c.name}
                        </Text>
                        <Text className="mt-1 text-xs text-app-text-muted" numberOfLines={1}>
                          {c.city}
                        </Text>
                        <Text className="mt-2 text-xs leading-4 text-app-text-muted" numberOfLines={2}>
                          {c.description}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                </Link>
              ))}
            </View>
          )}
        </View>

        <View className="mb-6">
          <View className="mb-3 flex-row items-center justify-between gap-3">
            <Text className="min-w-0 flex-1 text-base font-semibold text-app-text" numberOfLines={1}>
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
                  <Text className="text-sm font-semibold text-app-text" numberOfLines={2}>
                    ЭМД мэдээлэл шалгах
                  </Text>
                  <Text className="mt-1 text-xs leading-4 text-app-text-muted" numberOfLines={2}>
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
            <Text className="min-w-0 flex-1 text-base font-semibold text-app-text" numberOfLines={2}>
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
                  description="4.5+ дундаж үнэлгээтэй эмч одоогоор байхгүй байна. Бүх эмчийн жагсаалтаас сонгоно уу."
                  action={{ label: "Эмнэлгүүд", onPress: () => router.push(routes.customerClinics), variant: "outline" }}
                />
              </Card>
            ) : (
              featuredDoctors.map((doctor) => (
                <Link key={doctor.id} href={`/clinic/${doctor.clinicId}/doctor/${doctor.id}`} asChild>
                  <Pressable className="rounded-2xl p-4 shadow-sm border-app-border bg-app-card">
                    <View className="flex-row items-center justify-between gap-3">
                      <AppImage
                        source={{ uri: resolveDoctorAvatarUri(doctor, 72) }}
                        fallbackIcon="account-circle-outline"
                        className="h-12 w-12 rounded-2xl border border-app-border"
                      />
                      <View className="min-w-0 flex-1">
                        <Text className="text-sm font-semibold text-app-text" numberOfLines={1}>
                          {doctor.name}
                        </Text>
                        <Text className="mt-1 text-xs text-app-text-muted" numberOfLines={2}>
                          {doctor.specialty}
                        </Text>
                      </View>
                      <View className="flex-row items-center rounded-full bg-amber-100 px-2 py-1 dark:bg-amber-900/40">
                        <MaterialCommunityIcons name="star" size={12} color="#f59e0b" />
                        <Text className="ml-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
                          {formatDoctorRatingLabel(doctor)}
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
