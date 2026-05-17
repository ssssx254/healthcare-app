import { Badge, Button, Card, ScreenScrollView, SectionHeader } from "@/components";
import { orderStatusLabel } from "@/constants/orderStatus";
import { useCustomerBooking } from "@/contexts/CustomerBookingContext";
import { getClinicById, getDoctor, getService } from "@/services/customerCatalog";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import type { MockService } from "@/types/customer";

export default function ServiceDetailScreen() {
  const { clinicId, doctorId, serviceId } = useLocalSearchParams<{
    clinicId: string;
    doctorId: string;
    serviceId: string;
  }>();
  const { setDraftClinic, setDraftDoctor, setDraftService } = useCustomerBooking();
  const [service, setService] = useState<MockService | null | undefined>(undefined);

  useEffect(() => {
    if (!clinicId) return;
    let alive = true;
    getClinicById(String(clinicId)).then((clinic) => {
      if (!alive || !clinic) return;
      setDraftClinic(clinic.id, clinic.name);
    });
    return () => {
      alive = false;
    };
  }, [clinicId, setDraftClinic]);

  useEffect(() => {
    if (!clinicId || !doctorId) return;
    let alive = true;
    getDoctor(String(clinicId), String(doctorId)).then((doctor) => {
      if (!alive || !doctor) return;
      setDraftDoctor(doctor.id, doctor.name);
    });
    return () => {
      alive = false;
    };
  }, [clinicId, doctorId, setDraftDoctor]);

  useEffect(() => {
    if (!doctorId || !serviceId) return;
    let alive = true;
    getService(String(doctorId), String(serviceId)).then((s) => {
      if (alive) setService(s ?? null);
    });
    return () => {
      alive = false;
    };
  }, [doctorId, serviceId]);

  useEffect(() => {
    if (service) setDraftService(service.id, service.title, service.kind, service.priceMnt, service.durationMinutes);
  }, [service, setDraftService]);

  return (
    <>
      <Stack.Screen options={{ title: "Үйлчилгээний дэлгэрэнгүй" }} />
      <ScreenScrollView
        className="flex-1 bg-slate-50 dark:bg-slate-950"
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
      >
        {service === undefined ? (
          <Card>
            <View className="items-center py-8">
              <ActivityIndicator />
              <Text className="mt-2 text-sm text-slate-500">Ачааллаж байна…</Text>
            </View>
          </Card>
        ) : service == null ? (
          <Card>
            <Text className="text-center text-slate-600 dark:text-slate-300">Үйлчилгээ олдсонгүй.</Text>
          </Card>
        ) : (
          <>
            <SectionHeader title={service.title} subtitle={`${service.durationMinutes} минут`} />
            <Card className="mb-4">
              <Text className="text-sm leading-6 text-slate-600 dark:text-slate-300">{service.description}</Text>
              <View className="mt-4 flex-row flex-wrap gap-2">
                <Badge
                  label={service.kind === "free_online" ? orderStatusLabel.free_consult : orderStatusLabel.payment_required}
                  tone={service.kind === "free_online" ? "success" : "warning"}
                />
              </View>
              {service.kind === "formal" ? (
                <Text className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-50">
                  {service.priceMnt.toString()} ₮
                </Text>
              ) : (
                <Text className="mt-4 text-lg font-bold text-brand-600 dark:text-brand-400">Төлбөргүй</Text>
              )}
            </Card>

            {service.kind === "formal" ? (
              <Button
                label="Цаг авах"
                onPress={() =>
                  router.push({
                    pathname: "/booking/select-day",
                    params: { clinicId: String(clinicId), doctorId: String(doctorId), serviceId: String(serviceId) },
                  })
                }
              />
            ) : (
              <Button label="Үнэгүй онлайн зөвлөгөө рүү" onPress={() => router.push("/(customer)/free-consult")} />
            )}
            <Button
              label="Буцах"
              variant="ghost"
              className="mt-2"
              onPress={() => router.back()}
            />
          </>
        )}
      </ScreenScrollView>
    </>
  );
}
