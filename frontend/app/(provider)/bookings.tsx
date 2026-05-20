import { Badge, Button, Card, EmptyState, ErrorState, ListSkeleton, ScreenScrollView, SectionHeader } from "@/components";
import { routes } from "@/constants/appRoutes";
import { providerBookingStatusLabel } from "@/constants/providerBookingStatus";
import { useProviderWorkspace } from "@/contexts/ProviderWorkspaceContext";
import type { Href } from "expo-router";
import { Link, Tabs, router } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function ProviderBookingsScreen() {
  const { bookings, workspaceLoading, workspaceError, refreshWorkspace } = useProviderWorkspace();
  const pendingList = bookings.filter((b) => b.providerStatus === "pending_request").slice(0, 6);

  return (
    <>
      <Tabs.Screen options={{ title: "Захиалга", headerTitle: "" }} />
      <ScreenScrollView className="flex-1 bg-app-bg" contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
        <SectionHeader title="Захиалга" subtitle="Батлах, хянах, дэлгэрэнгүй харах үйлдлүүд." />
        {workspaceError ? (
          <ErrorState
            className="mb-4"
            title="Захиалгын мэдээлэл ачаалагдаагүй"
            message={workspaceError}
            onRetry={() => void refreshWorkspace()}
            retryLabel="Дахин ачаалах"
          />
        ) : null}

        {workspaceLoading && bookings.length === 0 && !workspaceError ? (
          <Card className="mb-4">
            <ListSkeleton rows={2} />
          </Card>
        ) : null}

        <Card className="mb-4">
          <Text className="text-base font-semibold text-app-text">Захиалгын удирдлага</Text>
          <Text className="mt-1 text-sm text-app-text-muted">
            Батлах, хянах, дэлгэрэнгүй харах үйлдлүүд.
          </Text>
          <View className="mt-3 gap-2">
            <Link href={routes.providerOrdersRequests} asChild>
              <Button label="Хүлээгдэж буй хүсэлтүүд" />
            </Link>
            <Link href={routes.providerOrdersToday} asChild>
              <Button label="Өнөөдрийн захиалгууд" variant="outline" />
            </Link>
            <Link href={"/patients/index" as Href} asChild>
              <Button label="Өвчтөнүүд" variant="outline" />
            </Link>
            <Link href={routes.providerRevenue} asChild>
              <Button label="Орлого / статистик" variant="ghost" />
            </Link>
          </View>
        </Card>

        <Card>
          <View className="mb-3 flex-row items-center justify-between gap-2">
            <Text className="min-w-0 flex-1 text-sm font-semibold text-app-text" numberOfLines={2}>
              Сүүлийн хүсэлтүүд
            </Text>
            <Badge label={String(pendingList.length)} tone={pendingList.length > 0 ? "warning" : "neutral"} />
          </View>
          {workspaceError ? (
            <Text className="text-sm text-app-text-muted">
              Дээрх алдааг засаад дахин ачаалсны дараа энд харагдана.
            </Text>
          ) : pendingList.length === 0 ? (
            <EmptyState
              icon="clipboard-text-clock-outline"
              title="Хүлээгдэж буй хүсэлт алга"
              description="Шинэ захиалга ирэхэд энд харагдана. Хүсэлтүүдийг бүгдийг нь нээхийн тулд доорх товчийг дарна уу."
              action={{ label: "Бүх хүсэлт харах", onPress: () => router.push(routes.providerOrdersRequests), variant: "outline" }}
            />
          ) : null}
          {!workspaceError && pendingList.length > 0 ? (
            <View className="gap-2">
              {pendingList.map((b) => (
                <Pressable key={b.id} onPress={() => router.push(`/orders/${b.id}`)}>
                  <View className="rounded-xl border px-3 py-2.5 border-app-border bg-app-muted">
                    <View className="flex-row items-center justify-between gap-2">
                      <Text className="min-w-0 flex-1 font-medium text-app-text" numberOfLines={1}>
                        {b.patientName ?? "Үйлчлүүлэгч"}
                      </Text>
                      <Badge label={providerBookingStatusLabel[b.providerStatus]} tone="warning" />
                    </View>
                    <Text className="mt-0.5 text-xs text-app-text-muted" numberOfLines={2}>
                      {b.serviceTitle}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : null}
        </Card>
      </ScreenScrollView>
    </>
  );
}
