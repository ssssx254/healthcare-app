import { Button, Card, ScreenScrollView, SectionHeader } from "@/components";
import { routes } from "@/constants/appRoutes";
import { useAuth } from "@/hooks/useAuth";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Link, router, Tabs } from "expo-router";
import type { ComponentProps } from "react";
import { Pressable, Text, View } from "react-native";

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  const menuItems: Array<{
    href: string;
    label: string;
    icon: ComponentProps<typeof MaterialCommunityIcons>["name"];
  }> = [
    { href: "/wallet", label: "Цахим данс (хэтэвч)", icon: "wallet-outline" },
    { href: "/profile/personal-info", label: "Хувийн мэдээлэл", icon: "account-edit-outline" },
    { href: "/profile/change-password", label: "Нууц үг солих", icon: "lock-reset" },
    { href: "/profile/terms", label: "Үйлчилгээний нөхцөл", icon: "file-document-outline" },
    { href: "/profile/privacy", label: "Нууцлалын бодлого", icon: "shield-account-outline" },
    { href: "/profile/app-guide", label: "Аппликэйшн ашиглах заавар", icon: "book-open-page-variant-outline" },
    { href: "/profile/faq", label: "Түгээмэл асуулт, хариулт", icon: "frequently-asked-questions" },
  ];

  return (
    <>
      <Tabs.Screen options={{ tabBarLabel: "Профайл", headerTitle: "" }} />
      <ScreenScrollView
        className="flex-1 bg-slate-50 dark:bg-slate-950"
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
      >
        <SectionHeader
          title="Профайл"
          subtitle="Таны бүртгэл, мэдээлэл, тохиргоо."
          subtitleClassName="mt-1.5"
        />

        <Card className="mb-4">
          <Text className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Нэр</Text>
          <Text className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50">{user?.name}</Text>
          <Text className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Имэйл</Text>
          <Text className="mt-1 text-base text-slate-700 dark:text-slate-200">{user?.email}</Text>
        </Card>

        <Card className="mb-4">
          <View className="gap-1">
            {menuItems.map((item) => (
              <Link key={item.href} href={item.href as never} asChild>
                <Pressable className="flex-row items-center justify-between rounded-xl px-2 py-2.5 active:bg-slate-100 dark:active:bg-slate-800">
                  <View className="flex-row items-center gap-3">
                    <MaterialCommunityIcons name={item.icon} size={20} color="#2563eb" />
                    <Text className="text-sm text-slate-800 dark:text-slate-100">{item.label}</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#64748b" />
                </Pressable>
              </Link>
            ))}
          </View>
        </Card>

        <Link href="/(customer)/my-orders" asChild>
          <Button label="Миний захиалгууд" variant="outline" />
        </Link>

        <Button
          label="Гарах"
          variant="ghost"
          className="mt-3"
          onPress={() => {
            signOut();
            router.replace(routes.login);
          }}
        />
        <Link href="/(customer)/profile/delete-account" asChild>
          <Button label="Бүртгэл устгах" variant="ghost" className="mt-2" />
        </Link>
      </ScreenScrollView>
    </>
  );
}
