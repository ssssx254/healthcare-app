import { AppImage, Button, Card, EmptyState, ErrorState, ListSkeleton, ScreenScrollView, SectionHeader } from "@/components";
import { routes } from "@/constants/appRoutes";
import { useProviderWorkspace } from "@/contexts/ProviderWorkspaceContext";
import { resolveDoctorAvatarUri } from "@/lib/doctorAvatar";
import { Link, Stack, router } from "expo-router";
import { Text, View } from "react-native";

export default function DoctorsListScreen() {
  const { doctors, services, slots, workspaceLoading, workspaceError, refreshWorkspace } = useProviderWorkspace();

  return (
    <>
      <Stack.Screen options={{ title: "Эмчийн жагсаалт" }} />
      <ScreenScrollView
        className="flex-1 bg-slate-50 dark:bg-slate-950"
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
      >
        <SectionHeader title="Эмчийн жагсаалт" subtitle="Бүртгэлтэй эмч нар, үйлчилгээ болон слотын тоо." />
        <Link href={routes.providerDoctorRegister} asChild>
          <Button label="Шинэ эмч нэмэх" className="mb-4" />
        </Link>

        {workspaceError ? (
          <ErrorState
            className="mb-4"
            title="Жагсаалт ачаалагдаагүй"
            message={workspaceError}
            onRetry={() => void refreshWorkspace()}
            retryLabel="Дахин ачаалах"
          />
        ) : null}

        {workspaceLoading && doctors.length === 0 && !workspaceError ? (
          <Card>
            <ListSkeleton rows={4} />
          </Card>
        ) : null}

        {!workspaceLoading && !workspaceError && doctors.length === 0 ? (
          <Card className="overflow-hidden">
            <EmptyState
              icon="account-group-outline"
              title="Эмч бүртгэгдээгүй байна"
              description="Эхлээд эмч нэмж, үйлчилгээ болон цагийн хуваарь тохируулна уу."
              action={{ label: "Эмч бүртгэх", onPress: () => router.push(routes.providerDoctorRegister) }}
            />
          </Card>
        ) : null}

        {!workspaceError && doctors.length > 0 ? (
          <View className="gap-3">
            {doctors.map((d) => (
              <Card key={d.id}>
                <View className="flex-row items-start gap-3">
                  <AppImage
                    source={{ uri: resolveDoctorAvatarUri(d, 80) }}
                    fallbackIcon="doctor"
                    className="h-14 w-14 rounded-2xl border border-slate-200 dark:border-slate-700"
                  />
                  <View className="min-w-0 flex-1">
                    <Text className="text-lg font-semibold text-slate-900 dark:text-slate-50">{d.name}</Text>
                    <Text className="mt-1 text-sm text-slate-600 dark:text-slate-300">{d.specialty}</Text>
                    <Text className="mt-1 text-xs text-slate-500 dark:text-slate-400">{d.phone}</Text>
                    <Text className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Үйлчилгээ: {services.filter((s) => s.doctorId === d.id).length} · Слот:{" "}
                      {slots.filter((s) => s.doctorId === d.id).length}
                    </Text>
                    <Link href={`/doctor/${d.id}/edit`} asChild>
                      <Button label="Эмчийн мэдээлэл засах" variant="outline" className="mt-3" />
                    </Link>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        ) : null}
      </ScreenScrollView>
    </>
  );
}
