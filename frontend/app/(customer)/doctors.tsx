import {
  AppImage,
  Card,
  EmptyState,
  ErrorState,
  Input,
  ListSkeleton,
  LoadingState,
  ScreenScrollView,
  SectionHeader,
  ServiceCategorySection,
  type ServiceCategorySelection,
} from "@/components";
import { toFriendlyErrorMn } from "@/lib/friendlyErrorMn";
import { formatDoctorRatingLabel } from "@/lib/formatDoctorRating";
import { resolveDoctorAvatarUri } from "@/lib/doctorAvatar";
import { buildDoctorServiceCategories, doctorMatchesCategorySelection } from "@/lib/doctorCategoryFilter";
import { parseCategoryFilterFromParams } from "@/lib/doctorCategoryNav";
import { getClinicList, searchCatalogAsync } from "@/services/customerCatalog";
import { serviceApi } from "@/services/api/serviceApi";
import type { MockDoctor } from "@/types/customer";
import { router, Tabs, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

type DoctorCardView = {
  id: string;
  clinicId: string;
  name: string;
  specialty: string;
  rank: string;
  experience: string;
  rating: string;
  clinicName: string;
  photoUrl: string;
  raw: MockDoctor;
};

function specialtyRank(specialty: string): string {
  if (specialty.includes("Зүрх")) return "Тэргүүлэх зэргийн эмч";
  if (specialty.includes("Мэдрэл")) return "Ахлах зэргийн эмч";
  if (specialty.includes("Дотор")) return "Ахлах эмч";
  return "Клиникийн эмч";
}

function doctorExperience(doctor: MockDoctor): string {
  const years = doctor.experienceYears ?? 5;
  return `${years} жил`;
}

function mapDoctorCard(d: MockDoctor, clinicNameMap: Map<string, string>): DoctorCardView {
  return {
    id: d.id,
    clinicId: d.clinicId,
    name: d.name,
    specialty: d.specialty,
    rank: specialtyRank(d.specialty),
    experience: doctorExperience(d),
    rating: formatDoctorRatingLabel(d),
    clinicName: clinicNameMap.get(d.clinicId) ?? "Эмнэлэг",
    photoUrl: resolveDoctorAvatarUri(d, 96),
    raw: d,
  };
}

export default function DoctorsHubScreen() {
  const routeParams = useLocalSearchParams<{ filterKind?: string; filterId?: string }>();
  const [query, setQuery] = useState("");
  const [categorySelection, setCategorySelection] = useState<ServiceCategorySelection | null>(null);
  const [doctorCategoryIndex, setDoctorCategoryIndex] = useState<Map<string, Set<string>>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<DoctorCardView[]>([]);

  const loadDoctors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [result, clinics, services] = await Promise.all([
        searchCatalogAsync(""),
        getClinicList(),
        serviceApi.listAll(),
      ]);
      const clinicNameMap = new Map<string, string>(clinics.map((c) => [c.id, c.name]));
      setDoctorCategoryIndex(buildDoctorServiceCategories(services));
      setDoctors(result.doctors.map((d) => mapDoctorCard(d, clinicNameMap)));
    } catch (e) {
      setError(toFriendlyErrorMn(e instanceof Error ? e.message : "Эмчийн мэдээлэл ачааллахад алдаа гарлаа."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDoctors();
  }, [loadDoctors]);

  useEffect(() => {
    const parsed = parseCategoryFilterFromParams(routeParams);
    if (parsed) setCategorySelection(parsed);
  }, [routeParams.filterKind, routeParams.filterId]);

  const filteredDoctors = useMemo(() => {
    const q = query.trim().toLowerCase();
    return doctors.filter((d) => {
      if (!doctorMatchesCategorySelection(d.raw, categorySelection, doctorCategoryIndex)) return false;
      if (!q) return true;
      return (
        d.name.toLowerCase().includes(q) ||
        d.specialty.toLowerCase().includes(q) ||
        d.clinicName.toLowerCase().includes(q)
      );
    });
  }, [doctors, categorySelection, doctorCategoryIndex, query]);

  const emptyFilterActive =
    categorySelection != null && categorySelection.kind !== "all" && filteredDoctors.length === 0 && doctors.length > 0;

  return (
    <>
      <Tabs.Screen options={{ tabBarLabel: "Эмч нар", headerTitle: "" }} />
      <ScreenScrollView
        className="flex-1 bg-app-bg"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      >
        <SectionHeader title="Эмч нар" subtitle="Ангилал, мэргэжил, туршлагаар эмчээ сонгоно уу." />

        <Card className="mb-4">
          <Input
            label="Эмч хайх"
            value={query}
            onChangeText={setQuery}
            placeholder="Нэр, мэргэжил, эмнэлгээр хайх"
            autoCapitalize="none"
          />
        </Card>

        <Card className="mb-4 p-4">
          <ServiceCategorySection selection={categorySelection} onSelectCategory={setCategorySelection} />
        </Card>

        <View className="mb-3 flex-row items-center justify-between gap-2">
          <Text className="min-w-0 flex-1 text-sm font-semibold text-app-text" numberOfLines={1}>
            Эмчийн жагсаалт
          </Text>
          <Text className="shrink-0 text-xs text-app-text-muted">{filteredDoctors.length} эмч</Text>
        </View>

        {loading ? (
          <Card>
            <LoadingState compact title="Эмч нарыг ачааллаж байна…" subtitle="Эмнэлэг, мэргэжлийн мэдээлэл татагдаж байна." />
            <ListSkeleton rows={3} />
          </Card>
        ) : error ? (
          <ErrorState
            title="Эмчийн жагсаалт ачаалагдаагүй"
            message={error}
            onRetry={() => void loadDoctors()}
            retryLabel="Дахин оролдох"
          />
        ) : filteredDoctors.length === 0 ? (
          <Card className="overflow-hidden">
            <EmptyState
              icon="account-search-outline"
              title={doctors.length === 0 ? "Эмчийн мэдээлэл алга" : "Тохирох эмч олдсонгүй"}
              description={
                doctors.length === 0
                  ? "Каталог хоосон байна. Эмнэлгийн жагсаалтаас эхлээд сонгоно уу."
                  : emptyFilterActive
                    ? "Энэ ангилалд одоогоор эмч бүртгэгдээгүй байна. Өөр ангилал сонгох эсвэл шүүлтийг цуцлана уу."
                    : "Өөр түлхүүр үг эсвэл ангилал сонгож дахин хайна уу."
              }
              action={
                doctors.length === 0
                  ? { label: "Эмнэлгүүд", onPress: () => router.push("/(customer)/clinics"), variant: "outline" }
                  : emptyFilterActive
                    ? {
                        label: "Шүүлтийг цуцлах",
                        onPress: () => setCategorySelection({ kind: "all" }),
                        variant: "outline",
                      }
                    : undefined
              }
            />
          </Card>
        ) : (
          <View className="gap-3">
            {filteredDoctors.map((doctor) => (
              <Pressable
                key={doctor.id}
                onPress={() => router.push(`/clinic/${doctor.clinicId}/doctor/${doctor.id}`)}
                className="active:opacity-95"
              >
                <Card>
                  <View className="flex-row items-start gap-3">
                    <AppImage
                      source={{ uri: doctor.photoUrl }}
                      fallbackIcon="doctor"
                      className="h-16 w-16 rounded-2xl border border-app-border"
                    />
                    <View className="min-w-0 flex-1">
                      <Text className="text-sm font-semibold text-app-text" numberOfLines={1}>
                        {doctor.name}
                      </Text>
                      <Text className="mt-1 text-xs text-brand-700 dark:text-brand-300" numberOfLines={2}>
                        {doctor.specialty}
                      </Text>
                      <Text className="mt-1 text-xs text-app-text-muted" numberOfLines={2}>
                        {doctor.rank}
                      </Text>
                      <Text className="mt-1 text-xs text-app-text-muted" numberOfLines={2}>
                        Туршлага: {doctor.experience} · Үнэлгээ: {doctor.rating}
                      </Text>
                      <Text className="mt-1 text-xs text-app-text-muted" numberOfLines={2}>
                        {doctor.clinicName}
                      </Text>
                    </View>
                  </View>
                </Card>
              </Pressable>
            ))}
          </View>
        )}
      </ScreenScrollView>
    </>
  );
}
