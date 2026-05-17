import { Badge, Button, Card, EmptyState, ErrorState, ListSkeleton, ScreenScrollView, SectionHeader } from "@/components";
import { routes } from "@/constants/appRoutes";
import { providerBookingStatusLabel } from "@/constants/providerBookingStatus";
import { useProviderWorkspace } from "@/contexts/ProviderWorkspaceContext";
import { router, Stack } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function OrdersTodayScreen() {
  const { bookings, workspaceLoading, workspaceError, refreshWorkspace } = useProviderWorkspace();
  const todayIso = new Date().toISOString().slice(0, 10);
  const list = bookings.filter((b) => (b.date ?? b.createdAtIso.slice(0, 10)) === todayIso);

  return (
    <>
      <Stack.Screen options={{ title: "Өнөөдрийн захиалгууд" }} />
      <ScreenScrollView
        className="flex-1 bg-slate-50 dark:bg-slate-950"
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
      >
        <SectionHeader title="Өнөөдрийн захиалгууд" subtitle={`Огноо: ${todayIso}`} />

        {workspaceError ? (
          <ErrorState
            className="mb-4"
            title="Захиалга ачаалагдаагүй"
            message={workspaceError}
            onRetry={() => void refreshWorkspace()}
            retryLabel="Дахин ачаалах"
          />
        ) : null}

        {workspaceLoading && bookings.length === 0 && !workspaceError ? (
          <Card className="mb-4">
            <ListSkeleton rows={3} />
          </Card>
        ) : null}

        {!workspaceLoading && !workspaceError && list.length === 0 ? (
          <Card className="mb-4 overflow-hidden">
            <EmptyState
              icon="calendar-blank-outline"
              title="Өнөөдөр захиалга алга"
              description="Өнөөдрийн цагийн товлолт энд харагдана. Хуваарь болон боломжит цагаа шалгана уу."
              action={{ label: "Хуваарь нээх", onPress: () => router.push(routes.providerSchedule), variant: "outline" }}
            />
          </Card>
        ) : null}

        {!workspaceError && list.length > 0 ? (
          <View className="gap-2">
            {list.map((b) => (
              <Pressable key={b.id} onPress={() => router.push(`/orders/${b.id}`)}>
                <Card className="active:opacity-90">
                  <Text className="font-semibold text-slate-900 dark:text-slate-50">{b.patientName ?? "Үйлчлүүлэгч"}</Text>
                  <Text className="text-sm text-slate-600 dark:text-slate-300">{b.serviceTitle}</Text>
                  <View className="mt-2 flex-row flex-wrap gap-2">
                    <Badge label={providerBookingStatusLabel[b.providerStatus]} tone="neutral" />
                  </View>
                </Card>
              </Pressable>
            ))}
          </View>
        ) : null}
        <Button
          label="Захиалгын хүсэлтүүд рүү"
          variant="ghost"
          className="mt-4"
          onPress={() => router.push(routes.providerOrdersRequests)}
        />
      </ScreenScrollView>
    </>
  );
}
