import { Badge, Button, Card, FormScrollView, Input, SectionHeader } from "@/components";
import { getProviderServiceCategories, searchCatalogAsync } from "@/services/customerCatalog";
import type { MockClinicDetail, MockDoctor } from "@/types/customer";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

export default function SearchScreen() {
  const params = useLocalSearchParams<{ q?: string; city?: string; specialty?: string }>();
  const [query, setQuery] = useState(params.q ?? "");
  const [clinics, setClinics] = useState<MockClinicDetail[]>([]);
  const [doctors, setDoctors] = useState<MockDoctor[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await searchCatalogAsync(query, params.city, params.specialty);
      setClinics(res.clinics);
      setDoctors(res.doctors);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Хайлт амжилтгүй боллоо.";
      setError(msg);
      setClinics([]);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }, [query, params.city, params.specialty]);

  useEffect(() => {
    void runSearch();
  }, [runSearch]);

  useEffect(() => {
    getProviderServiceCategories()
      .then((cats) => setCategories(cats))
      .catch(() => setCategories([]));
  }, []);

  return (
    <>
      <Stack.Screen options={{ title: "Хайлт" }} />
      <FormScrollView
        className="flex-1 bg-slate-50 dark:bg-slate-950"
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
      >
        <SectionHeader title="Хайлт" subtitle="Эмнэлэг, эмчээр хайна уу." />
        <Input
          label="Хайлтын үг"
          value={query}
          onChangeText={setQuery}
          placeholder="Жишээ: өргөө, хүүхэд"
          hint="Доорх үр дүн автоматаар шинэчлэгдэнэ."
        />
        {(params.city || params.specialty) && (
          <View className="mb-3 flex-row flex-wrap gap-2">
            {params.city ? <Badge label={`Хот: ${params.city}`} tone="neutral" /> : null}
            {params.specialty ? <Badge label={`Мэргэшил: ${params.specialty}`} tone="neutral" /> : null}
          </View>
        )}
        {categories.length > 0 ? (
          <Card className="mb-3">
            <Text className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-50">Үйлчилгээний ангилал</Text>
            <View className="flex-row flex-wrap gap-2">
              {categories.slice(0, 12).map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => setQuery(cat)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                >
                  <Text className="text-xs text-slate-700 dark:text-slate-300">{cat}</Text>
                </Pressable>
              ))}
            </View>
          </Card>
        ) : null}

        {loading ? (
          <Card className="mb-4">
            <View className="items-center py-6">
              <ActivityIndicator />
              <Text className="mt-2 text-sm text-slate-500">Ачааллаж байна…</Text>
            </View>
          </Card>
        ) : null}
        {error ? (
          <Card className="mb-4">
            <Text className="text-center text-sm text-red-600 dark:text-red-400">{error}</Text>
            <Button label="Дахин оролдох" className="mt-3" onPress={runSearch} />
          </Card>
        ) : null}

        {!loading && !error ? (
          <>
            <Text className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">Эмнэлгүүд</Text>
            {clinics.length === 0 ? (
              <Card className="mb-4">
                <Text className="text-center text-sm text-slate-500">Илэрц олдсонгүй.</Text>
              </Card>
            ) : (
              <View className="mb-4 gap-2">
                {clinics.map((c) => (
                  <Pressable key={c.id} onPress={() => router.push(`/clinic/${c.id}`)}>
                    <Card className="active:opacity-90">
                      <Text className="font-semibold text-slate-900 dark:text-slate-50">{c.name}</Text>
                      <Text className="text-xs text-slate-500 dark:text-slate-400">{c.city}</Text>
                    </Card>
                  </Pressable>
                ))}
              </View>
            )}

            <Text className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">Эмч нар</Text>
            {doctors.length === 0 ? (
              <Card>
                <Text className="text-center text-sm text-slate-500">Эмч олдсонгүй.</Text>
              </Card>
            ) : (
              <View className="gap-2">
                {doctors.map((d) => (
                  <Pressable
                    key={d.id}
                    onPress={() => router.push(`/clinic/${d.clinicId}/doctor/${d.id}`)}
                  >
                    <Card className="active:opacity-90">
                      <Text className="font-semibold text-slate-900 dark:text-slate-50">{d.name}</Text>
                      <Text className="text-xs text-slate-500 dark:text-slate-400">{d.specialty}</Text>
                    </Card>
                  </Pressable>
                ))}
              </View>
            )}
          </>
        ) : null}

        <Button label="Шүүлтүүр" variant="outline" className="mt-4" onPress={() => router.push("/(customer)/filters")} />
      </FormScrollView>
    </>
  );
}
