import { AppImage, Badge, Button, Card, ScreenScrollView, SectionHeader } from "@/components";
import { useCustomerBooking } from "@/contexts/CustomerBookingContext";
import { resolveDoctorAvatarUri } from "@/lib/doctorAvatar";
import { getDoctorsByClinic } from "@/services/customerCatalog";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import type { MockDoctor } from "@/types/customer";

export default function DoctorsScreen() {
  const { clinicId } = useLocalSearchParams<{ clinicId: string }>();
  const { setDraftDoctor } = useCustomerBooking();
  const [doctors, setDoctors] = useState<MockDoctor[] | null>(null);

  useEffect(() => {
    if (!clinicId) return;
    let alive = true;
    getDoctorsByClinic(String(clinicId)).then((d) => {
      if (alive) setDoctors(d);
    });
    return () => {
      alive = false;
    };
  }, [clinicId]);

  return (
    <>
      <Stack.Screen options={{ title: "Эмч нар" }} />
      <ScreenScrollView
        className="flex-1 bg-app-bg"
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
      >
        <SectionHeader title="Эмч нар" subtitle="Эмч сонгоод үйлчилгээ үзнэ үү." />
        {doctors === null ? (
          <Card>
            <View className="items-center py-8">
              <ActivityIndicator />
              <Text className="mt-2 text-sm text-slate-500">Ачааллаж байна…</Text>
            </View>
          </Card>
        ) : doctors.length === 0 ? (
          <Card>
            <Text className="text-center text-app-text-secondary">Эмч бүртгэлгүй байна.</Text>
          </Card>
        ) : (
          <View className="gap-3">
            {doctors.map((d) => (
              <Card key={d.id}>
                <View className="flex-row items-start gap-3">
                  <AppImage
                    source={{ uri: resolveDoctorAvatarUri(d, 72) }}
                    fallbackIcon="doctor"
                    className="h-14 w-14 rounded-2xl border border-app-border"
                  />
                  <View className="min-w-0 flex-1">
                    <View className="flex-row items-center justify-between gap-2">
                      <Text className="flex-1 text-lg font-semibold text-app-text">{d.name}</Text>
                      <Badge label={d.specialty} tone="brand" />
                    </View>
                    <Text className="mt-2 text-sm text-app-text-secondary">Туршлага: {d.experienceYears} жил</Text>
                    <Text className="mt-2 text-sm leading-6 text-app-text-secondary">{d.bio}</Text>
                    <Button
                      label="Дэлгэрэнгүй"
                      className="mt-4"
                      onPress={() => {
                        setDraftDoctor(d.id, d.name);
                        router.push(`/clinic/${clinicId}/doctor/${d.id}`);
                      }}
                    />
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScreenScrollView>
    </>
  );
}
