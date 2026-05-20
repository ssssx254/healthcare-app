import { Button, Card, ScreenScrollView, SectionHeader } from "@/components";
import { useCustomerBooking } from "@/contexts/CustomerBookingContext";
import { getClinicById } from "@/services/customerCatalog";
import { Link, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import type { MockClinicDetail } from "@/types/customer";

export default function ClinicDetailScreen() {
  const { clinicId } = useLocalSearchParams<{ clinicId: string }>();
  const { setDraftClinic } = useCustomerBooking();
  const [clinic, setClinic] = useState<MockClinicDetail | null | undefined>(undefined);

  useEffect(() => {
    if (!clinicId) return;
    let alive = true;
    getClinicById(String(clinicId)).then((c) => {
      if (alive) setClinic(c);
    });
    return () => {
      alive = false;
    };
  }, [clinicId]);

  useEffect(() => {
    if (clinic) setDraftClinic(clinic.id, clinic.name);
  }, [clinic, setDraftClinic]);

  return (
    <>
      <Stack.Screen options={{ title: "Эмнэлгийн дэлгэрэнгүй" }} />
      <ScreenScrollView
        className="flex-1 bg-app-bg"
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
      >
        {clinic === undefined ? (
          <Card>
            <View className="items-center py-8">
              <ActivityIndicator />
              <Text className="mt-2 text-sm text-slate-500">Ачааллаж байна…</Text>
            </View>
          </Card>
        ) : clinic == null ? (
          <Card>
            <Text className="text-center text-app-text-secondary">Эмнэлэг олдсонгүй.</Text>
          </Card>
        ) : (
          <>
            <SectionHeader title={clinic.name} subtitle={clinic.city} />
            <Card className="mb-4">
              <Text className="text-sm font-medium text-app-text-secondary">Хаяг</Text>
              <Text className="mt-1 text-sm text-app-text-secondary">{clinic.address}</Text>
              <Text className="mt-3 text-sm font-medium text-app-text-secondary">Утас</Text>
              <Text className="mt-1 text-sm text-app-text-secondary">{clinic.phone}</Text>
              <Text className="mt-3 text-sm leading-6 text-app-text-secondary">{clinic.description}</Text>
              <Text className="mt-3 text-xs text-app-text-muted">Эмч нар: {clinic.doctorsCount}</Text>
            </Card>
            <Link href={`/clinic/${clinic.id}/doctors`} asChild>
              <Button label="Эмч нар харах" />
            </Link>
            <Link href="/(customer)/clinics" asChild>
              <Button label="Жагсаалт руу буцах" variant="ghost" className="mt-3" />
            </Link>
          </>
        )}
      </ScreenScrollView>
    </>
  );
}
