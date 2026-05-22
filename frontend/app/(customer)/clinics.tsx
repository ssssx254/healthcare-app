import { AppImage, Button, Card, EmptyState, ErrorState, LoadingState, ScreenScrollView, SectionHeader } from "@/components";
import { resolveClinicLogoUri } from "@/lib/clinicLogo";
import { toFriendlyErrorMn } from "@/lib/friendlyErrorMn";
import { useCustomerBooking } from "@/contexts/CustomerBookingContext";
import { getClinicList } from "@/services/customerCatalog";
import { Link, Stack } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import type { MockClinicDetail } from "@/types/customer";

export default function ClinicsScreen() {
  const { resetDraft } = useCustomerBooking();
  const [clinics, setClinics] = useState<MockClinicDetail[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    resetDraft();
  }, [resetDraft]);

  const reload = useCallback(() => {
    setClinics(null);
    setLoadError(null);
    void getClinicList()
      .then((data) => setClinics(data))
      .catch((e) => {
        setClinics([]);
        setLoadError(toFriendlyErrorMn(e instanceof Error ? e.message : "Ачааллахад алдаа гарлаа."));
      });
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <>
      <Stack.Screen options={{ title: "Эмнэлгүүд" }} />
      <ScreenScrollView
        className="flex-1 bg-app-bg"
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
      >
        <SectionHeader title="Эмнэлгүүд" subtitle="Бүртгэлтэй эмнэлгүүдээс сонгоно уу." />
        {loadError ? (
          <ErrorState
            className="mb-4"
            title="Жагсаалт ачаалагдаагүй"
            message={loadError}
            onRetry={reload}
            retryLabel="Дахин оролдох"
          />
        ) : null}
        {clinics === null ? (
          <Card>
            <LoadingState compact title="Эмнэлгүүдийг ачааллаж байна…" subtitle="Сүлжээний хурднаас хамааран хэдэн секунд үргэлжилж болно." />
          </Card>
        ) : clinics.length === 0 ? (
          <Card className="overflow-hidden">
            <EmptyState
              icon="hospital-box-outline"
              title="Эмнэлэг байхгүй байна"
              description="Одоогоор платформд харагдах эмнэлэг алга. Дараа дахин шалгана уу эсвэл сүлжээгээ шалгана уу."
              action={{ label: "Дахин ачаалах", onPress: reload, variant: "outline" }}
            />
          </Card>
        ) : (
          <View className="gap-3">
            {clinics.map((c) => (
              <Card key={c.id}>
                <View className="flex-row items-start gap-3">
                  <AppImage
                    source={{ uri: resolveClinicLogoUri(c, 64) }}
                    fallbackIcon="hospital-building"
                    className="h-10 w-10 shrink-0 rounded-xl border border-app-border"
                  />
                  <View className="min-w-0 flex-1">
                    <Text className="text-lg font-semibold text-app-text" numberOfLines={2}>
                      {c.name}
                    </Text>
                    <Text className="mt-1 text-sm text-app-text-secondary" numberOfLines={1}>
                      {c.city}
                    </Text>
                    <Text className="mt-2 text-xs leading-5 text-app-text-muted" numberOfLines={4}>
                      {c.description}
                    </Text>
                  </View>
                </View>
                <Link href={`/clinic/${c.id}`} asChild>
                  <Button label="Дэлгэрэнгүй үзэх" className="mt-4" />
                </Link>
              </Card>
            ))}
          </View>
        )}
      </ScreenScrollView>
    </>
  );
}
