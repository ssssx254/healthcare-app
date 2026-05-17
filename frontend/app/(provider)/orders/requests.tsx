import { Badge, Card, EmptyState, ErrorState, ListSkeleton, ScreenScrollView, SectionHeader } from "@/components";
import { providerBookingStatusLabel } from "@/constants/providerBookingStatus";
import { useProviderWorkspace } from "@/contexts/ProviderWorkspaceContext";
import { router, Stack } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function OrderRequestsScreen() {
  const { bookings, workspaceLoading, workspaceError, refreshWorkspace } = useProviderWorkspace();
  const list = bookings.filter((b) => b.providerStatus === "pending_request");

  return (
    <>
      <Stack.Screen options={{ title: "Захиалгын хүсэлтүүд" }} />
      <ScreenScrollView
        className="flex-1 bg-slate-50 dark:bg-slate-950"
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
      >
        <SectionHeader title="Захиалгын хүсэлтүүд" subtitle="Батлах эсвэл татгалзах шаардлагатай." />

        {workspaceError ? (
          <ErrorState
            className="mb-4"
            title="Жагсаалт ачаалагдаагүй"
            message={workspaceError}
            onRetry={() => void refreshWorkspace()}
            retryLabel="Дахин ачаалах"
          />
        ) : null}

        {workspaceLoading && bookings.length === 0 && !workspaceError ? (
          <Card>
            <ListSkeleton rows={4} />
          </Card>
        ) : null}

        {!workspaceLoading && !workspaceError && list.length === 0 ? (
          <Card className="overflow-hidden">
            <EmptyState
              icon="clipboard-check-outline"
              title="Хүлээгдэж буй хүсэлт алга"
              description="Өвчтөн захиалга илгээхэд энд шинэ хүсэлт харагдана. Сүлжээ болон мэдэгдлээ шалгана уу."
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
                  <Text className="mt-1 text-xs text-slate-500 dark:text-slate-400">{b.doctorName}</Text>
                  <Badge label={providerBookingStatusLabel[b.providerStatus]} tone="warning" className="mt-2" />
                </Card>
              </Pressable>
            ))}
          </View>
        ) : null}
      </ScreenScrollView>
    </>
  );
}
