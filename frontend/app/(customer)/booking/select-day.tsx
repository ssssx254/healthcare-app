import { Button, Card, ScreenScrollView, SectionHeader } from "@/components";
import { useCustomerBooking } from "@/contexts/CustomerBookingContext";
import { getClinicById, getDoctor, getService, getSlotsByDoctor } from "@/services/customerCatalog";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import type { MockTimeSlot } from "@/types/customer";

function formatDayLabel(dateIso: string): string {
  const d = new Date(dateIso);
  return d.toLocaleDateString("mn-MN", { month: "numeric", day: "numeric", weekday: "short" });
}

export default function SelectDayScreen() {
  const { clinicId, doctorId, serviceId } = useLocalSearchParams<{ clinicId?: string; doctorId?: string; serviceId?: string }>();
  const { draft, setDraftClinic, setDraftDoctor, setDraftService, setDraftSlot } = useCustomerBooking();
  const [slots, setSlots] = useState<MockTimeSlot[] | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(draft.slotId);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const doctor = draft.doctorId ?? doctorId ?? null;
    if (!doctor) {
      setSlots([]);
      return;
    }
    let alive = true;
    setLoadError(null);
    getSlotsByDoctor(doctor, { serviceId: (draft.serviceId ?? serviceId) || undefined })
      .then((s) => {
        if (!alive) return;
        setSlots(s);
        if (s.length > 0) setSelectedDate(s[0].dateIso);
      })
      .catch(() => {
        if (!alive) return;
        setSlots([]);
        setLoadError("Өдөр ачааллахад алдаа гарлаа. Дахин оролдоно уу.");
      });
    return () => {
      alive = false;
    };
  }, [draft.doctorId, draft.serviceId, doctorId, serviceId, clinicId]);

  useEffect(() => {
    const id = String(clinicId ?? "").trim();
    if (!id || draft.clinicId) return;
    let alive = true;
    getClinicById(id).then((clinic) => {
      if (!alive || !clinic) return;
      setDraftClinic(clinic.id, clinic.name);
    });
    return () => {
      alive = false;
    };
  }, [clinicId, draft.clinicId, setDraftClinic]);

  useEffect(() => {
    const cId = String(clinicId ?? "").trim();
    const dId = String(doctorId ?? "").trim();
    if (!cId || !dId || draft.doctorId) return;
    let alive = true;
    getDoctor(cId, dId).then((doctor) => {
      if (!alive || !doctor) return;
      setDraftDoctor(doctor.id, doctor.name);
    });
    return () => {
      alive = false;
    };
  }, [clinicId, doctorId, draft.doctorId, setDraftDoctor]);

  useEffect(() => {
    const dId = String(doctorId ?? "").trim();
    const sId = String(serviceId ?? "").trim();
    if (!dId || !sId || draft.serviceId) return;
    let alive = true;
    getService(dId, sId).then((service) => {
      if (!alive || !service) return;
      setDraftService(service.id, service.title, service.kind, service.priceMnt, service.durationMinutes);
    });
    return () => {
      alive = false;
    };
  }, [doctorId, serviceId, draft.serviceId, setDraftService]);

  const days = useMemo(() => {
    const set = new Set<string>();
    for (const s of slots ?? []) set.add(s.dateIso);
    return Array.from(set).sort();
  }, [slots]);

  const daySlots = useMemo(() => {
    if (!selectedDate) return [];
    return (slots ?? []).filter((s) => s.dateIso === selectedDate);
  }, [slots, selectedDate]);

  useEffect(() => {
    if (daySlots.length === 0) {
      setSelectedSlotId(null);
      return;
    }
    if (!daySlots.some((s) => s.id === selectedSlotId)) {
      setSelectedSlotId(daySlots[0].id);
    }
  }, [daySlots, selectedSlotId]);

  return (
    <>
      <Stack.Screen options={{ title: "Цаг авах / Өдөр сонгох" }} />
      <ScreenScrollView className="flex-1 bg-app-bg" contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
        <SectionHeader title="Өдөр сонгох" subtitle="Танд тохирох үзлэгийн өдрийг сонгоно уу." />

        {slots === null ? (
          <Card>
            <View className="items-center py-8">
              <ActivityIndicator />
              <Text className="mt-2 text-sm text-slate-500">Өдөр ачааллаж байна…</Text>
            </View>
          </Card>
        ) : loadError ? (
          <Card>
            <Text className="text-sm text-red-600 dark:text-red-400">{loadError}</Text>
          </Card>
        ) : days.length === 0 ? (
          <Card>
            <Text className="text-sm text-app-text-secondary">Сонгох боломжтой өдөр алга байна.</Text>
          </Card>
        ) : (
          <View className="gap-3">
            <Card>
              <Text className="mb-3 text-sm font-semibold text-app-text">Өдрүүд</Text>
              <View className="flex-row flex-wrap gap-2">
                {days.map((d) => {
                  const active = d === selectedDate;
                  return (
                    <Pressable
                      key={d}
                      onPress={() => setSelectedDate(d)}
                      className={`rounded-xl border px-3 py-2 ${
                        active
                          ? "border-brand-600 bg-brand-50 dark:border-brand-400 dark:bg-brand-900"
                          : "border-slate-200 bg-white border-app-border bg-app-card"
                      }`}
                    >
                      <Text className={`text-xs font-medium ${active ? "text-brand-700 dark:text-brand-300" : "text-app-text-secondary"}`}>
                        {formatDayLabel(d)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Card>

            <Text className="text-base font-semibold text-app-text">Цаг сонгох</Text>
            <Card className="border-l-4 border-l-amber-400">
              <Text className="text-sm font-semibold text-app-text">Анхааруулга:</Text>
              <Text className="mt-1 text-sm text-app-text-secondary">
                Та өөрийн амьдарч буй улсын/бүсийн цагаар цагаа сонгоно уу.
              </Text>
            </Card>
            {selectedDate && daySlots.length > 0 ? (
              <Card>
                <View className="flex-row flex-wrap gap-2">
                  {daySlots.map((slot) => {
                    const active = selectedSlotId === slot.id;
                    const slotText = slot.label.replace(slot.dateIso, "").trim() || slot.label;
                    return (
                      <Pressable
                        key={slot.id}
                        onPress={() => setSelectedSlotId(slot.id)}
                        className={`min-w-[88px] rounded-xl border px-3 py-3 ${
                          active
                            ? "border-brand-600 bg-brand-50 dark:border-brand-400 dark:bg-brand-900"
                            : "border-slate-200 bg-white border-app-border bg-app-card"
                        }`}
                      >
                        <Text className={`text-center text-sm font-semibold ${active ? "text-brand-700 dark:text-brand-300" : "text-app-text"}`}>
                          {slotText}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Card>
            ) : (
              <Card>
                <Text className="text-sm text-app-text-secondary">Сонгосон өдөрт боломжтой цаг алга байна.</Text>
              </Card>
            )}

            <Button
              label="Цаг авах"
              disabled={!selectedDate || !selectedSlotId}
              onPress={() => {
                if (!selectedDate || !selectedSlotId) return;
                const picked = daySlots.find((s) => s.id === selectedSlotId);
                if (!picked) return;
                const selectedTime = picked.label.replace(picked.dateIso, "").trim() || picked.label;
                setDraftSlot(picked.id, picked.label, picked.dateIso, selectedTime);
                router.push("/(customer)/health-form");
              }}
            />
          </View>
        )}
      </ScreenScrollView>
    </>
  );
}

