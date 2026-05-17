import { Badge, Card, EmptyState, ErrorState, ListSkeleton, ScreenScrollView, SectionHeader } from "@/components";
import { routes } from "@/constants/appRoutes";
import { useProviderWorkspace } from "@/contexts/ProviderWorkspaceContext";
import { router, Stack, type Href } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function ProviderPatientsScreen() {
  const { bookings, workspaceLoading, workspaceError, refreshWorkspace } = useProviderWorkspace();

  const patients = Object.values(
    bookings.reduce<Record<string, { name: string; phone: string; lastVisit: string; total: number }>>((acc, b) => {
      const key = b.patientName ?? "Үйлчлүүлэгч";
      const lastVisit = b.date ?? b.createdAtIso.slice(0, 10);
      if (!acc[key]) {
        acc[key] = { name: key, phone: "9900-0000", lastVisit, total: 1 };
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
      <ScreenScrollView className="flex-1 bg-slate-50 dark:bg-slate-950" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
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
                key={p.name}
                onPress={() => router.push(`/patients/${encodeURIComponent(p.name)}` as Href)}
              >
                <Card>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-base font-semibold text-slate-900 dark:text-slate-50">{p.name}</Text>
                    <Badge label={`${p.total} үзлэг`} tone="neutral" />
                  </View>
                  <Text className="mt-1 text-xs text-slate-500 dark:text-slate-400">Утас: {p.phone}</Text>
                  <Text className="mt-1 text-xs text-slate-500 dark:text-slate-400">Сүүлийн үзлэг: {p.lastVisit}</Text>
                </Card>
              </Pressable>
            ))}
          </View>
        ) : null}
      </ScreenScrollView>
    </>
  );
}
