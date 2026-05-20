import { Badge, Card, EmptyState, ErrorState, ListSkeleton, ScreenScrollView, SectionHeader } from "@/components";
import { routes } from "@/constants/appRoutes";
import { useProviderWorkspace } from "@/contexts/ProviderWorkspaceContext";
import { router, Stack, type Href } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function ProviderPatientsScreen() {
  const { bookings, workspaceLoading, workspaceError, refreshWorkspace } = useProviderWorkspace();

  const patients = Object.values(
    bookings.reduce<
      Record<string, { patientId: string; name: string; phone: string; lastVisit: string; total: number }>
    >((acc, b) => {
      const pid = b.patientId ?? b.id;
      const key = pid;
      const name = b.patientName ?? "Үйлчлүүлэгч";
      const lastVisit = b.date ?? b.createdAtIso.slice(0, 10);
      if (!acc[key]) {
        acc[key] = { patientId: pid, name, phone: "—", lastVisit, total: 1 };
      } else {
        acc[key].total += 1;
        if (lastVisit > acc[key].lastVisit) acc[key].lastVisit = lastVisit;
      }
      return acc;
    }, {}),
  );

  return (
    <>
      <Stack.Screen options={{ title: "Өвчтөн" }} />
      <ScreenScrollView className="flex-1 bg-app-bg" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <SectionHeader title="Өвчтөний жагсаалт" subtitle="Захиалгад тулгуурласан өвчтөний мэдээлэл." />

        {workspaceError ? (
          <ErrorState
            className="mb-4"
            title="Өгөгдөл ачаалагдаагүй"
            message={workspaceError}
            onRetry={() => void refreshWorkspace()}
            retryLabel="Дахин ачаалах"
          />
        ) : null}

        {workspaceLoading && bookings.length === 0 && !workspaceError ? (
          <Card>
            <ListSkeleton rows={3} />
          </Card>
        ) : null}

        {!workspaceLoading && !workspaceError && patients.length === 0 ? (
          <Card className="overflow-hidden">
            <EmptyState
              icon="account-heart-outline"
              title="Өвчтөний түүх алга"
              description="Захиалга баталгаажмагц энд өвчтөнүүдийн жагсаалт үүснэ. Эхлээд захиалгыг шалгана уу."
              action={{ label: "Захиалга руу", onPress: () => router.push(routes.providerBookings), variant: "outline" }}
            />
          </Card>
        ) : null}

        {!workspaceError && patients.length > 0 ? (
          <View className="gap-3">
            {patients.map((p) => (
              <Pressable
                key={p.patientId}
                onPress={() => router.push(`/patients/${encodeURIComponent(p.patientId)}` as Href)}
              >
                <Card>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-base font-semibold text-app-text">{p.name}</Text>
                    <Badge label={`${p.total} үзлэг`} tone="neutral" />
                  </View>
                  <Text className="mt-1 text-xs text-app-text-muted">Сүүлийн үзлэг: {p.lastVisit}</Text>
                </Card>
              </Pressable>
            ))}
          </View>
        ) : null}
      </ScreenScrollView>
    </>
  );
}
