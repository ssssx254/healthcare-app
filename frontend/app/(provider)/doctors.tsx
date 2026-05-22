import { AppImage, Button, Card, EmptyState, ErrorState, ListSkeleton, ScreenScrollView, SectionHeader } from "@/components";
import { routes } from "@/constants/appRoutes";
import { useProviderWorkspace } from "@/contexts/ProviderWorkspaceContext";
import { removeDoctorPhotoOverride } from "@/data/healthcare/doctorPhotoOverridesStore";
import { ApiError } from "@/lib/api/client";
import { resolveDoctorAvatarUri } from "@/lib/doctorAvatar";
import { toFriendlyErrorMn } from "@/lib/friendlyErrorMn";
import { Link, Stack, router } from "expo-router";
import { useState } from "react";
import { Alert, Text, View } from "react-native";

export default function DoctorsListScreen() {
  const { doctors, services, slots, workspaceLoading, workspaceError, refreshWorkspace, removeDoctor } =
    useProviderWorkspace();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const confirmRemoveDoctor = (doctorId: string, doctorName: string) => {
    const serviceCount = services.filter((s) => s.doctorId === doctorId).length;
    const slotCount = slots.filter((s) => s.doctorId === doctorId).length;
    Alert.alert(
      "Эмч устгах уу?",
      `${doctorName} эмчийн бүртгэл, үйлчилгээ (${serviceCount}), цагийн слот (${slotCount}) устгагдана. Үргэлжлүүлэх үү?`,
      [
        { text: "Болих", style: "cancel" },
        {
          text: "Устгах",
          style: "destructive",
          onPress: () => {
            void (async () => {
              setActionError(null);
              setDeletingId(doctorId);
              try {
                await removeDoctor(doctorId);
                await removeDoctorPhotoOverride(doctorId);
              } catch (e) {
                const msg =
                  e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Эмч устгахад алдаа гарлаа.";
                setActionError(toFriendlyErrorMn(msg));
              } finally {
                setDeletingId(null);
              }
            })();
          },
        },
      ],
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: "Эмчийн жагсаалт" }} />
      <ScreenScrollView
        className="flex-1 bg-app-bg"
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
      >
        <SectionHeader title="Эмчийн жагсаалт" subtitle="Бүртгэлтэй эмч нар, үйлчилгээ болон слотын тоо." />
        <Link href={routes.providerDoctorRegister} asChild>
          <Button label="Шинэ эмч нэмэх" className="mb-4" />
        </Link>

        {actionError ? (
          <Card className="mb-4 border border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/40">
            <Text className="text-sm text-rose-800 dark:text-rose-200">{actionError}</Text>
          </Card>
        ) : null}

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
                    className="h-14 w-14 rounded-2xl border border-app-border"
                  />
                  <View className="min-w-0 flex-1">
                    <Text className="text-lg font-semibold text-app-text">{d.name}</Text>
                    <Text className="mt-1 text-sm text-app-text-secondary">{d.specialty}</Text>
                    <Text className="mt-1 text-xs text-app-text-muted">{d.phone}</Text>
                    <Text className="mt-1 text-xs text-app-text-muted">
                      Үйлчилгээ: {services.filter((s) => s.doctorId === d.id).length} · Слот:{" "}
                      {slots.filter((s) => s.doctorId === d.id).length}
                    </Text>
                    <View className="mt-3 flex-row gap-2">
                      <Link href={`/doctor/${d.id}/edit`} asChild>
                        <Button label="Засах" variant="outline" className="flex-1" />
                      </Link>
                      <Button
                        label="Устгах"
                        variant="secondary"
                        className="flex-1"
                        loading={deletingId === d.id}
                        disabled={deletingId != null && deletingId !== d.id}
                        onPress={() => confirmRemoveDoctor(d.id, d.name)}
                      />
                    </View>
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
