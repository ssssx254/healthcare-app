import { Badge, Button, Card, EmptyState, ErrorState, ListSkeleton, ScreenScrollView, SectionHeader } from "@/components";
import { routes } from "@/constants/appRoutes";
import { orderStatusLabel } from "@/constants/orderStatus";
import { useProviderWorkspace } from "@/contexts/ProviderWorkspaceContext";
import { Link, Stack, router } from "expo-router";
import { Text, View } from "react-native";

export default function ServicesManageScreen() {
  const { services, doctors, removeService, workspaceLoading, workspaceError, refreshWorkspace } = useProviderWorkspace();

  const doctorName = (id: string) => doctors.find((d) => d.id === id)?.name ?? id;

  return (
    <>
      <Stack.Screen options={{ title: "Үйлчилгээ", headerTitle: "" }} />
      <ScreenScrollView
        className="flex-1 bg-slate-50 dark:bg-slate-950"
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
      >
        <SectionHeader title="Үйлчилгээ удирдах" subtitle="Үнэгүй онлайн болон төлбөртэй үйлчилгээ." />
        <View className="mb-4 flex-row gap-2">
          <Link href={routes.providerServicesNew} asChild>
            <Button label="Шинэ үйлчилгээ нэмэх" className="flex-1" />
          </Link>
          <Link href="/(provider)/categories" asChild>
            <Button label="Ангилал" variant="outline" className="flex-1" />
          </Link>
        </View>

        {workspaceError ? (
          <ErrorState
            className="mb-4"
            title="Үйлчилгээний жагсаалт ачаалагдаагүй"
            message={workspaceError}
            onRetry={() => void refreshWorkspace()}
            retryLabel="Дахин ачаалах"
          />
        ) : null}

        {workspaceLoading && services.length === 0 && !workspaceError ? (
          <Card>
            <ListSkeleton rows={4} />
          </Card>
        ) : null}

        {!workspaceLoading && !workspaceError && services.length === 0 ? (
          <Card className="overflow-hidden">
            <EmptyState
              icon="stethoscope"
              title="Үйлчилгээ бүртгэгдээгүй"
              description="Эмч бүртгэсний дараа үйлчилгээний нэр, үнэ, үргэлжлэх хугацааг энд нэмнэ."
              action={{ label: "Үйлчилгээ нэмэх", onPress: () => router.push(routes.providerServicesNew) }}
            />
          </Card>
        ) : null}

        {!workspaceError && services.length > 0 ? (
          <View className="gap-3">
            {services.map((s) => (
              <Card key={s.id}>
                <View className="flex-row flex-wrap items-center justify-between gap-2">
                  <Text className="min-w-0 flex-1 text-base font-semibold text-slate-900 dark:text-slate-50">
                    {s.title}
                  </Text>
                  <Badge
                    label={s.kind === "free_online" ? orderStatusLabel.free_consult : orderStatusLabel.payment_required}
                    tone={s.kind === "free_online" ? "success" : "warning"}
                  />
                </View>
                <Text className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Эмч: {doctorName(s.doctorId)} · {s.durationMinutes} мин · Ангилал: {s.categoryName ?? "Ерөнхий"}
                </Text>
                <Text className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Төлөв: {s.isActive === false ? "Идэвхгүй" : "Идэвхтэй"}
                </Text>
                {s.kind === "formal" ? (
                  <Text className="mt-1 text-sm font-medium text-brand-700 dark:text-brand-300">
                    {s.priceMnt.toString()} ₮
                  </Text>
                ) : (
                  <Text className="mt-1 text-sm text-brand-600 dark:text-brand-400">Төлбөргүй</Text>
                )}
                <View className="mt-3 flex-row gap-2">
                  <Link href={`/services/${s.id}/edit`} asChild>
                    <Button label="Үйлчилгээ засах" variant="outline" className="flex-1" />
                  </Link>
                  <Button
                    label="Устгах"
                    variant="secondary"
                    className="flex-1"
                    onPress={() => void removeService(s.id)}
                  />
                </View>
              </Card>
            ))}
          </View>
        ) : null}
      </ScreenScrollView>
    </>
  );
}
