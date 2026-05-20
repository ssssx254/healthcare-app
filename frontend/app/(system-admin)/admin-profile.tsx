import { Button, Card, ScreenScrollView, SectionHeader } from "@/components";
import { routes } from "@/constants/appRoutes";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, router } from "expo-router";
import { Text } from "react-native";

export default function AdminProfileScreen() {
  const { user, signOut } = useAuth();

  return (
    <>
      <Tabs.Screen options={{ title: "Админ тохиргоо" }} />
      <ScreenScrollView className="flex-1 bg-app-bg" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <SectionHeader title="Систем админ" subtitle="Платформын бүхэл удирдлагын тохиргоо." />
        <Card className="mb-3">
          <Text className="text-xs text-app-text-muted">Нэр</Text>
          <Text className="mt-1 text-base font-semibold text-app-text">{user?.name ?? "—"}</Text>
          <Text className="mt-3 text-xs text-app-text-muted">И-мэйл</Text>
          <Text className="mt-1 text-sm text-app-text-secondary">{user?.email ?? "—"}</Text>
          <Text className="mt-3 text-xs text-app-text-muted">Эрх</Text>
          <Text className="mt-1 text-sm text-app-text-secondary">Системийн админ</Text>
        </Card>

        <Card className="mb-3">
          <Text className="text-sm font-semibold text-app-text">Платформын нэмэлт удирдлага</Text>
          <Text className="mt-2 text-xs text-app-text-muted">
            Онцлох эмнэлэг/эмч/нийтлэл, хэрэглээний хяналт зэрэг нэмэлт хэсгүүдийг энд өргөтгөнө.
          </Text>
        </Card>

        <Button
          label="Гарах"
          variant="ghost"
          onPress={() => {
            signOut();
            router.replace(routes.login);
          }}
        />
      </ScreenScrollView>
    </>
  );
}

