import { Button, Card, EmptyState, ErrorState, ListSkeleton, ScreenScrollView, SectionHeader } from "@/components";
import { routes } from "@/constants/appRoutes";
import { useProviderWorkspace } from "@/contexts/ProviderWorkspaceContext";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { Link, Stack, router } from "expo-router";
import { useMemo, useState } from "react";
import { Text, View } from "react-native";

export default function ScheduleScreen() {
  const { slots, doctors, services, removeSlot, blockSlot, workspaceLoading, workspaceError, refreshWorkspace } = useProviderWorkspace();
  const { isOnline } = useNetworkStatus();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const doctorName = (id: string) => doctors.find((d) => d.id === id)?.name ?? id;
  const serviceName = (id?: string | null) => (id ? services.find((s) => s.id === id)?.title ?? `Үйлчилгээ #${id}` : "Ерөнхий слот");
  const allDates = useMemo(() => [...new Set(slots.map((s) => s.dateIso))].sort(), [slots]);
  const visibleSlots = useMemo(
    () => slots.filter((s) => !selectedDate || s.dateIso === selectedDate),
    [slots, selectedDate],
  );

  return (
    <>
      <Stack.Screen options={{ title: "Хуваарь" }} />
      <ScreenScrollView
        className="flex-1 bg-slate-50 dark:bg-slate-950"
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
      >
        <SectionHeader title="Цагийн хуваарь" subtitle="7 хоногийн хуваарь, боломжит цаг, хаалттай өдрүүд." />
        <Card className="mb-4">
          <Text className="text-sm text-slate-600 dark:text-slate-300">
            Слот нь эмчийн 7 хоногийн хуваарь + үйлчилгээний үргэлжлэх хугацаанд тулгуурлан үүснэ.
          </Text>
          <Text className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Эмч: {doctors.length} · Үйлчилгээ: {services.length} · Нийт слот: {slots.length}
          </Text>
        </Card>
        <Link href={routes.providerScheduleAddSlot} asChild>
          <Button label="Боломжит цаг нэмэх" className="mb-4" disabled={!isOnline} />
        </Link>
        <Link href={routes.providerDoctors} asChild>
          <Button label="Эмчийн долоо хоногийн хуваарь тохируулах" variant="outline" className="mb-4" />
        </Link>
        {!isOnline ? (
          <Card className="mb-4">
            <Text className="text-xs text-slate-600 dark:text-slate-300">
              Офлайн үед хуваарь өөрчлөх боломжгүй. Интернеттэй болоход дахин оролдоно уу.
            </Text>
          </Card>
        ) : null}

        {workspaceError ? (
          <ErrorState
            className="mb-4"
            title="Хуваарь ачаалагдаагүй"
            message={workspaceError}
            onRetry={() => void refreshWorkspace()}
            retryLabel="Дахин ачаалах"
          />
        ) : null}

        {workspaceLoading && slots.length === 0 && !workspaceError ? (
          <Card className="mb-4">
            <ListSkeleton rows={3} />
          </Card>
        ) : null}

        {allDates.length > 0 ? (
          <Card className="mb-4">
            <Text className="text-sm font-semibold text-slate-900 dark:text-slate-50">Өдөр шүүх</Text>
            <View className="mt-3 flex-row flex-wrap gap-2">
              {allDates.map((d) => {
                const active = selectedDate === d;
                return (
                  <Button
                    key={d}
                    label={d}
                    variant={active ? "primary" : "outline"}
                    className="px-2"
                    onPress={() => setSelectedDate((prev) => (prev === d ? null : d))}
                  />
                );
              })}
            </View>
            <Text className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Слотуудыг серверт хадгалсан тул үйлчлүүлэгч талын апп дээр автоматаар харагдана.
            </Text>
          </Card>
        ) : null}

        {!workspaceLoading && !workspaceError && visibleSlots.length === 0 ? (
          <Card className="overflow-hidden">
            <EmptyState
              icon="calendar-clock-outline"
              title="Боломжит цаг алга"
              description="Эмч нэмээд хуваарь тохируулах эсвэл доорх товчоор гараар цаг оруулна уу."
              action={{ label: "Цаг нэмэх", onPress: () => router.push(routes.providerScheduleAddSlot) }}
            />
          </Card>
        ) : null}

        {visibleSlots.length > 0 ? (
          <View className="gap-2">
            {visibleSlots.map((s) => (
              <Card key={s.id}>
                <Text className="font-semibold text-slate-900 dark:text-slate-50">{s.label}</Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400">
                  {s.dateIso} · {doctorName(s.doctorId)}
                </Text>
                <Text className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Үйлчилгээ: {serviceName(s.serviceId)} · Хугацаа: {s.durationMinutes ?? 0} мин · Төлөв: {s.status ?? "available"}
                </Text>
                <View className="mt-2 flex-row gap-2">
                  <Button label="Хаах" variant="secondary" className="flex-1" disabled={!isOnline} onPress={() => void blockSlot(s.id)} />
                  <Button label="Устгах" variant="outline" className="flex-1" disabled={!isOnline} onPress={() => void removeSlot(s.id)} />
                </View>
              </Card>
            ))}
          </View>
        ) : null}
      </ScreenScrollView>
    </>
  );
}
