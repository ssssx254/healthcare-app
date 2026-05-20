import { Button, Card, ScreenScrollView, SectionHeader } from "@/components";
import { useProviderWorkspace } from "@/contexts/ProviderWorkspaceContext";
import { Link, Stack } from "expo-router";
import { Text } from "react-native";

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
