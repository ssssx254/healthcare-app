import { Button, Card, ScreenScrollView, SectionHeader } from "@/components";
import { useCustomerBooking } from "@/contexts/CustomerBookingContext";
import { getSlotsByDoctor } from "@/services/customerCatalog";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import type { MockTimeSlot } from "@/types/customer";

function formatDayLabel(dateIso?: string): string {
  if (!dateIso) return "Өдөр сонгогдоогүй";
  const d = new Date(dateIso);
  return d.toLocaleDateString("mn-MN", { month: "numeric", day: "numeric", weekday: "long" });
}

function extractStartHour(label: string): number {
  const m = label.match(/(\d{1,2}):\d{2}/);
  if (!m) return 24;
  return Number(m[1]);
}

function getTimePeriodLabel(hour: number): "Өглөө" | "Үдээс хойш" | "Орой" {
  if (hour < 12) return "Өглөө";
  if (hour < 18) return "Үдээс хойш";
  return "Орой";
}

export default function SelectSlotScreen() {
  const { date, doctorId, serviceId } = useLocalSearchParams<{ date?: string; doctorId?: string; serviceId?: string }>();
  const { draft, setDraftSlot } = useCustomerBooking();
  const [slots, setSlots] = useState<MockTimeSlot[] | null>(null);
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
        if (alive) setSlots(s);
      })
      .catch(() => {
        if (!alive) return;
        setSlots([]);
        setLoadError("Цагийн жагсаалт ачааллахад алдаа гарлаа. Дахин оролдоно уу.");
      });
    return () => {
      alive = false;
    };
  }, [draft.doctorId, draft.serviceId, doctorId, serviceId]);

  const daySlots = useMemo(() => {
    if (!slots) return [];
    if (!date) return slots;
    return slots.filter((s) => s.dateIso === date);
  }, [slots, date]);

  const groupedSlots = useMemo(() => {
    const buckets: Record<"Өглөө" | "Үдээс хойш" | "Орой", MockTimeSlot[]> = {
      Өглөө: [],
      "Үдээс хойш": [],
      Орой: [],
    };
    for (const slot of daySlots) {
      const hour = extractStartHour(slot.label);
      const period = getTimePeriodLabel(hour);
      buckets[period].push(slot);
    }
    return buckets;
  }, [daySlots]);

  return (
    <>
      <Stack.Screen options={{ title: "Цаг сонгох" }} />
      <ScreenScrollView
        className="flex-1 bg-slate-50 dark:bg-slate-950"
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
      >
        <SectionHeader
          title="Цаг сонгох"
          subtitle={date ? `${formatDayLabel(date)} өдөр` : "Албан ёсны уулзалтын цаг — төлбөртэй үйлчилгээ."}
        />

        {slots === null ? (
          <Card>
            <View className="items-center py-8">
              <ActivityIndicator />
              <Text className="mt-2 text-sm text-slate-500">Ачааллаж байна…</Text>
            </View>
          </Card>
        ) : loadError ? (
          <Card>
            <Text className="text-sm text-red-600 dark:text-red-400">{loadError}</Text>
          </Card>
        ) : daySlots.length === 0 ? (
          <Card>
            <Text className="text-sm text-slate-600 dark:text-slate-300">Энэ өдөр сонгох боломжтой цаг алга байна.</Text>
          </Card>
        ) : (
          <View className="gap-3">
            <Card>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-semibold text-slate-900 dark:text-slate-50">Боломжтой цагууд</Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400">{daySlots.length} цаг</Text>
              </View>
              <Text className="mt-1 text-xs text-slate-500 dark:text-slate-400">Нэг цаг товшоод доорх “Үргэлжлүүлэх” дээр дарна уу.</Text>
            </Card>

            {(Object.keys(groupedSlots) as (keyof typeof groupedSlots)[]).map((period) => {
              const items = groupedSlots[period];
              if (items.length === 0) return null;
              return (
                <Card key={period}>
                  <Text className="mb-2 text-xs font-semibold text-slate-600 dark:text-slate-300">{period}</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {items.map((slot) => {
                      const selected = selectedSlotId === slot.id;
                      return (
                        <Pressable
                          key={slot.id}
                          onPress={() => setSelectedSlotId(slot.id)}
                          className={`min-w-[92px] rounded-xl border px-3 py-2 ${
                            selected
                              ? "border-brand-600 bg-brand-50 dark:border-brand-400 dark:bg-brand-900"
                              : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                          }`}
                        >
                          <Text className={`text-sm font-semibold ${selected ? "text-brand-700 dark:text-brand-300" : "text-slate-900 dark:text-slate-50"}`}>
                            {slot.label.replace(slot.dateIso, "").trim() || slot.label}
                          </Text>
                          <Text className={`mt-1 text-[11px] ${selected ? "text-brand-700 dark:text-brand-300" : "text-emerald-600 dark:text-emerald-400"}`}>
                            {selected ? "Сонгогдсон" : "Боломжтой"}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </Card>
              );
            })}
            <Button
              label="Үргэлжлүүлэх"
              className="mt-2"
              disabled={!selectedSlotId}
              onPress={() => {
                const picked = daySlots.find((s) => s.id === selectedSlotId);
                if (!picked) return;
                const selectedTime = picked.label.replace(picked.dateIso, "").trim() || picked.label;
                setDraftSlot(picked.id, picked.label, picked.dateIso, selectedTime);
                router.push("/(customer)/health-form");
              }}
            />
          </View>
        )}

        <Button label="Буцах" variant="ghost" className="mt-4" onPress={() => router.back()} />
      </ScreenScrollView>
    </>
  );
}
