import { Card } from "@/components";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

export type SlotDayTimeOption = {
  id: number;
  slot_date: string;
  start_time: string;
  end_time: string;
  label: string;
};

type SlotDayTimePickerProps = {
  slots: SlotDayTimeOption[];
  selectedSlotId: number | null;
  onSelectSlotId: (id: number) => void;
  emptyLabel?: string;
};

function formatDayLabel(dateIso: string): string {
  const d = new Date(`${dateIso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return dateIso;
  return d.toLocaleDateString("mn-MN", { month: "numeric", day: "numeric", weekday: "short" });
}

function slotTimeLabel(slot: SlotDayTimeOption): string {
  if (slot.start_time && slot.end_time) {
    return `${slot.start_time} – ${slot.end_time}`;
  }
  return slot.label.replace(slot.slot_date, "").trim() || slot.label;
}

export function SlotDayTimePicker({ slots, selectedSlotId, onSelectSlotId, emptyLabel }: SlotDayTimePickerProps) {
  const days = useMemo(() => {
    const set = new Set<string>();
    for (const s of slots) {
      if (s.slot_date) set.add(s.slot_date);
    }
    return Array.from(set).sort();
  }, [slots]);

  const [selectedDate, setSelectedDate] = useState<string | null>(days[0] ?? null);

  useEffect(() => {
    if (days.length === 0) {
      setSelectedDate(null);
      return;
    }
    if (!selectedDate || !days.includes(selectedDate)) {
      setSelectedDate(days[0]);
    }
  }, [days, selectedDate]);

  const daySlots = useMemo(() => {
    if (!selectedDate) return [];
    return slots.filter((s) => s.slot_date === selectedDate);
  }, [slots, selectedDate]);

  useEffect(() => {
    if (daySlots.length === 0) return;
    if (!daySlots.some((s) => s.id === selectedSlotId)) {
      onSelectSlotId(daySlots[0].id);
    }
  }, [daySlots, onSelectSlotId, selectedSlotId]);

  if (slots.length === 0) {
    return <Text className="text-sm text-app-text-secondary">{emptyLabel ?? "Боломжит цаг алга."}</Text>;
  }

  return (
    <View className="gap-3">
      <Card className="border-0 bg-app-muted/50 p-0 shadow-none">
        <Text className="mb-3 text-sm font-semibold text-app-text">Өдөр сонгох</Text>
        <View className="flex-row flex-wrap gap-2">
          {days.map((d) => {
            const active = d === selectedDate;
            const count = slots.filter((s) => s.slot_date === d).length;
            return (
              <Pressable
                key={d}
                onPress={() => setSelectedDate(d)}
                className={`rounded-xl border px-3 py-2 ${
                  active
                    ? "border-brand-600 bg-brand-50 dark:border-brand-400 dark:bg-brand-950/40"
                    : "border-app-border bg-app-card"
                }`}
              >
                <Text className={`text-xs font-medium ${active ? "text-brand-700 dark:text-brand-300" : "text-app-text-secondary"}`}>
                  {formatDayLabel(d)}
                </Text>
                <Text className={`mt-0.5 text-[10px] ${active ? "text-brand-600 dark:text-brand-400" : "text-app-text-muted"}`}>
                  {count} цаг
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      {selectedDate && daySlots.length > 0 ? (
        <View>
          <Text className="mb-2 text-sm font-semibold text-app-text">Цаг сонгох</Text>
          <View className="flex-row flex-wrap gap-2">
            {daySlots.map((slot) => {
              const active = selectedSlotId === slot.id;
              return (
                <Pressable key={slot.id} onPress={() => onSelectSlotId(slot.id)}>
                  <View
                    className={`min-w-[96px] flex-row items-center justify-center gap-1 rounded-xl border px-3 py-3 ${
                      active
                        ? "border-brand-600 bg-brand-50 dark:border-brand-400 dark:bg-brand-950/40"
                        : "border-app-border bg-app-card"
                    }`}
                  >
                    <MaterialCommunityIcons name="clock-outline" size={16} color={active ? "#2563eb" : "#94a3b8"} />
                    <Text className={`text-sm font-semibold ${active ? "text-brand-700 dark:text-brand-300" : "text-app-text"}`}>
                      {slotTimeLabel(slot)}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : (
        <Text className="text-sm text-app-text-secondary">Сонгосон өдөрт боломжит цаг алга.</Text>
      )}
    </View>
  );
}
