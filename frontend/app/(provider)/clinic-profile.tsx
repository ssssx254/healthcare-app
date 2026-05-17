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
        className="flex-1 bg-slate-50 dark:bg-slate-950"
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
      >
        <SectionHeader title="Эмнэлгийн профайл" subtitle="Үйлчлүүлэгчид харагдах мэдээлэл." />
        <Card>
          <Text className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Нэр</Text>
          <Text className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50">{clinic.name || "—"}</Text>
          <Text className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Хот</Text>
          <Text className="mt-1 text-base text-slate-700 dark:text-slate-200">{clinic.city || "—"}</Text>
          <Text className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Хаяг</Text>
          <Text className="mt-1 text-base text-slate-700 dark:text-slate-200">{clinic.address || "—"}</Text>
          <Text className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Утас</Text>
          <Text className="mt-1 text-base text-slate-700 dark:text-slate-200">{clinic.phone || "—"}</Text>
          <Text className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Танилцуулга</Text>
          <Text className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{clinic.description || "—"}</Text>
          <Text className="mt-4 text-xs text-slate-500 dark:text-slate-400">
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
