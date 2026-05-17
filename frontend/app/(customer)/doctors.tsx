import { AppImage, Button, Card, EmptyState, ErrorState, Input, ListSkeleton, LoadingState, ScreenScrollView, SectionHeader } from "@/components";
import { toFriendlyErrorMn } from "@/lib/friendlyErrorMn";
import { resolveDoctorAvatarUri } from "@/lib/doctorAvatar";
import { getClinicList, searchCatalogAsync } from "@/services/customerCatalog";
import type { MockClinicDetail, MockDoctor } from "@/types/customer";
import { Link, router, Tabs } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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

function doctorRating(id: string): string {
  const n = Number(id.replace(/\D/g, "").slice(-1) || "7");
  return (4.5 + (n % 5) * 0.1).toFixed(1);
}

export default function DoctorsHubScreen() {
  const [query, setQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("Бүгд");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<DoctorCardView[]>([]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    Promise.all([searchCatalogAsync(""), getClinicList()])
      .then(([result, clinics]) => {
        if (!active) return;
        const clinicNameMap = new Map<string, string>(clinics.map((c) => [c.id, c.name]));
        const mapped = result.doctors.map((d) => ({
          id: d.id,
          clinicId: d.clinicId,
          name: d.name,
          specialty: d.specialty,
          rank: specialtyRank(d.specialty),
          experience: doctorExperience(d),
          rating: doctorRating(d.id),
          clinicName: clinicNameMap.get(d.clinicId) ?? "Эмнэлэг",
          photoUrl: resolveDoctorAvatarUri(d, 96),
        }));
        setDoctors(mapped);
      })
      .catch((e) =>
        setError(toFriendlyErrorMn(e instanceof Error ? e.message : "Эмчийн мэдээлэл ачааллахад алдаа гарлаа.")),
      )
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>(["Бүгд"]);
    for (const d of doctors) set.add(d.specialty);
    return Array.from(set);
  }, [doctors]);

  const categoryDisplay = expandedCategories ? categories : categories.slice(0, 8);

  const filteredDoctors = useMemo(() => {
    const q = query.trim().toLowerCase();
    return doctors.filter((d) => {
      const byCategory = selectedCategory === "Бүгд" || d.specialty === selectedCategory;
      if (!byCategory) return false;
      if (!q) return true;
      return d.name.toLowerCase().includes(q) || d.specialty.toLowerCase().includes(q) || d.clinicName.toLowerCase().includes(q);
    });
  }, [doctors, selectedCategory, query]);

  return (
    <>
      <Tabs.Screen options={{ tabBarLabel: "Эмч нар", headerTitle: "" }} />
      <ScreenScrollView
        className="flex-1 bg-slate-50 dark:bg-slate-950"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      >
        <SectionHeader title="Эмч нар" subtitle="Мэргэжил болон туршлагаар эмчээ сонгоно уу." />

        <Card className="mb-4">
          <Input
            label="Эмч хайх"
            value={query}
            onChangeText={setQuery}
            placeholder="Нэр, мэргэжил, эмнэлгээр хайх"
            autoCapitalize="none"
          />
        </Card>

        <Card className="mb-4">
          <View className="mb-3 flex-row items-center justify-between gap-2">
            <Text className="min-w-0 flex-1 text-sm font-semibold text-slate-900 dark:text-slate-50" numberOfLines={1}>
              Ангилал
            </Text>
            {categories.length > 8 ? (
              <Pressable className="shrink-0" onPress={() => setExpandedCategories((s) => !s)}>
                <Text className="text-xs font-medium text-brand-700 dark:text-brand-300">
                  {expandedCategories ? "Хураах" : "Дэлгэрүүлэх"}
                </Text>
              </Pressable>
            ) : null}
          </View>
          <View className="flex-row flex-wrap gap-2">
            {categoryDisplay.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  className={`rounded-full border px-3 py-2 ${
                    active
                      ? "border-brand-600 bg-brand-50 dark:border-brand-400 dark:bg-brand-900"
                      : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                  }`}
                >
                  <Text
                    className={`text-center text-xs font-medium ${active ? "text-brand-700 dark:text-brand-300" : "text-slate-600 dark:text-slate-300"}`}
                    numberOfLines={2}
                  >
                    {cat}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <View className="mb-3 flex-row items-center justify-between gap-2">
          <Text className="min-w-0 flex-1 text-sm font-semibold text-slate-900 dark:text-slate-50" numberOfLines={1}>
            Эмчийн жагсаалт
          </Text>
          <Text className="shrink-0 text-xs text-slate-500 dark:text-slate-400">{filteredDoctors.length} эмч</Text>
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
            onRetry={() => {
              setError(null);
              setLoading(true);
              Promise.all([searchCatalogAsync(""), getClinicList()])
                .then(([result, clinics]) => {
                  const clinicNameMap = new Map<string, string>(clinics.map((c) => [c.id, c.name]));
                  const mapped = result.doctors.map((d) => ({
                    id: d.id,
                    clinicId: d.clinicId,
                    name: d.name,
                    specialty: d.specialty,
                    rank: specialtyRank(d.specialty),
                    experience: doctorExperience(d),
                    rating: doctorRating(d.id),
                    clinicName: clinicNameMap.get(d.clinicId) ?? "Эмнэлэг",
                    photoUrl: resolveDoctorAvatarUri(d, 96),
                  }));
                  setDoctors(mapped);
                })
                .catch((e) =>
                  setError(toFriendlyErrorMn(e instanceof Error ? e.message : "Эмчийн мэдээлэл ачааллахад алдаа гарлаа.")),
                )
                .finally(() => setLoading(false));
            }}
            retryLabel="Дахин оролдох"
          />
        ) : filteredDoctors.length === 0 ? (
          <Card className="overflow-hidden">
            <EmptyState
              icon="account-search-outline"
              title={doctors.length === 0 ? "Эмчийн мэдээлэл алга" : "Хайлтад тохирох эмч алга"}
              description={
                doctors.length === 0
                  ? "Каталог хоосон байна. Эмнэлгийн жагсаалтаас эхлээд сонгоно уу."
                  : "Өөр түлхүүр үг эсвэл ангилал сонгож дахин хайна уу."
              }
              action={
                doctors.length === 0
                  ? { label: "Эмнэлгүүд", onPress: () => router.push("/(customer)/clinics"), variant: "outline" }
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
                      className="h-16 w-16 rounded-2xl border border-slate-200 dark:border-slate-700"
                    />
                    <View className="min-w-0 flex-1">
                      <Text className="text-sm font-semibold text-slate-900 dark:text-slate-50" numberOfLines={1}>
                        {doctor.name}
                      </Text>
                      <Text className="mt-1 text-xs text-brand-700 dark:text-brand-300" numberOfLines={2}>
                        {doctor.specialty}
                      </Text>
                      <Text className="mt-1 text-xs text-slate-500 dark:text-slate-400" numberOfLines={2}>
                        {doctor.rank}
                      </Text>
                      <Text className="mt-1 text-xs text-slate-500 dark:text-slate-400" numberOfLines={2}>
                        Туршлага: {doctor.experience} · Үнэлгээ: {doctor.rating}
                      </Text>
                      <Text className="mt-1 text-xs text-slate-500 dark:text-slate-400" numberOfLines={2}>
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
