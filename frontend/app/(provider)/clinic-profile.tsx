import { AppImage, Button, Card, ScreenScrollView, SectionHeader } from "@/components";
import { useProviderWorkspace } from "@/contexts/ProviderWorkspaceContext";
import { resolveClinicLogoUri } from "@/lib/clinicLogo";
import { Link, Stack } from "expo-router";
import { Text, View } from "react-native";

export default function ClinicProfileScreen() {
  const { clinic } = useProviderWorkspace();

  return (
    <>
      <Stack.Screen options={{ title: "Эмнэлгийн профайл" }} />
      <ScreenScrollView
        className="flex-1 bg-app-bg"
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
      >
        <SectionHeader title="Эмнэлгийн профайл" subtitle="Үйлчлүүлэгчид харагдах мэдээлэл." />
        <Card>
          <View className="mb-4 flex-row items-center gap-3">
            <AppImage
              source={{ uri: resolveClinicLogoUri(clinic, 96) }}
              fallbackIcon="hospital-building"
              className="h-16 w-16 rounded-2xl border border-app-border"
            />
            <View className="min-w-0 flex-1">
              <Text className="text-xs font-medium uppercase tracking-wide text-app-text-muted">Лого</Text>
              <Text className="mt-0.5 text-sm text-app-text-secondary">
                {clinic.logoUrl ? "Тохируулсан" : "Тохируулаагүй"}
              </Text>
            </View>
          </View>
          <Text className="text-xs font-medium uppercase tracking-wide text-app-text-muted">Нэр</Text>
          <Text className="mt-1 text-lg font-semibold text-app-text">{clinic.name || "—"}</Text>
          <Text className="mt-4 text-xs font-medium uppercase tracking-wide text-app-text-muted">Хот</Text>
          <Text className="mt-1 text-base text-app-text-secondary">{clinic.city || "—"}</Text>
          <Text className="mt-4 text-xs font-medium uppercase tracking-wide text-app-text-muted">Хаяг</Text>
          <Text className="mt-1 text-base text-app-text-secondary">{clinic.address || "—"}</Text>
          <Text className="mt-4 text-xs font-medium uppercase tracking-wide text-app-text-muted">Утас</Text>
          <Text className="mt-1 text-base text-app-text-secondary">{clinic.phone || "—"}</Text>
          <Text className="mt-4 text-xs font-medium uppercase tracking-wide text-app-text-muted">Танилцуулга</Text>
          <Text className="mt-1 text-sm leading-6 text-app-text-secondary">{clinic.description || "—"}</Text>
          <Text className="mt-4 text-xs text-app-text-muted">
            Төлөв: {clinic.registered ? "Бүртгэлтэй" : "Бүртгэл дутуу"}
          </Text>
        </Card>
        <Link href="/(provider)/clinic-edit" asChild>
          <Button label="Эмнэлгийн мэдээлэл засах" className="mt-4" />
        </Link>
      </ScreenScrollView>
    </>
  );
}
