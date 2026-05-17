import { Badge, Button, Card, ScreenScrollView, SectionHeader } from "@/components";
import { routes } from "@/constants/appRoutes";
import { useAuth } from "@/hooks/useAuth";
import { useProviderWorkspace } from "@/contexts/ProviderWorkspaceContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, Tabs } from "expo-router";
import { Pressable, Text, View } from "react-native";

function SettingsRow({
  label,
  subtitle,
  icon,
  badge,
  onPress,
}: {
  label: string;
  subtitle?: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  badge?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      className="flex-row items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50 px-3.5 py-3 active:opacity-85 dark:border-slate-700 dark:bg-slate-900/70"
      disabled={!onPress}
      onPress={onPress}
    >
      <View className="min-w-0 flex-1 flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-900/40">
          <MaterialCommunityIcons name={icon} size={20} color="#2563eb" />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-sm font-semibold text-slate-900 dark:text-slate-50">{label}</Text>
          {subtitle ? <Text className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</Text> : null}
        </View>
      </View>
      {badge ? <Badge label={badge} tone="neutral" /> : onPress ? <MaterialCommunityIcons name="chevron-right" size={20} color="#94a3b8" /> : null}
    </Pressable>
  );
}

export default function ProviderProfileScreen() {
  const { user, signOut } = useAuth();
  const { clinic, doctors } = useProviderWorkspace();
  const completenessItems = [clinic.name, clinic.address, clinic.phone, clinic.description, doctors.length > 0 ? "ok" : ""];
  const completeness = Math.round((completenessItems.filter(Boolean).length / completenessItems.length) * 100);
  const approvalLabel =
    user?.approvalStatus === "approved" ? "Баталгаажсан" : user?.approvalStatus === "rejected" ? "Татгалзсан" : "Хүлээгдэж байна";

  return (
    <>
      <Tabs.Screen options={{ title: "Профайл", headerTitle: "" }} />
      <ScreenScrollView
        className="flex-1 bg-slate-50 dark:bg-slate-950"
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
      >
        <SectionHeader title="Профайл ба тохиргоо" subtitle="Эмнэлгийн удирдлага, аккаунтын тохиргоо нэг дор." />

        <Card className="mb-3">
          <Text className="text-xs text-slate-500 dark:text-slate-400">Хувийн мэдээлэл</Text>
          <Text className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-50">{user?.name ?? "—"}</Text>
          <Text className="mt-1 text-sm text-slate-700 dark:text-slate-200">{user?.email ?? "—"}</Text>
          <Text className="mt-1 text-xs text-slate-500 dark:text-slate-400">{user?.phone ?? "Утас бүртгэгдээгүй"}</Text>
        </Card>
        {user?.approvalStatus !== "approved" ? (
          <Card className="mb-3 border border-amber-300 bg-amber-50 dark:border-amber-800/60 dark:bg-amber-900/20">
            <Text className="text-sm font-semibold text-amber-800 dark:text-amber-300">Баталгаажуулалтын төлөв: {approvalLabel}</Text>
            <Text className="mt-1 text-xs leading-5 text-amber-700 dark:text-amber-200">
              Таны эмнэлгийн бүртгэлийг админ шалгаж байна. Баталгаажих хүртэл зарим удирдлагын үйлдэл хязгаарлагдана.
            </Text>
          </Card>
        ) : null}

        <View className="mb-2">
          <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Тохиргооны хэсгүүд</Text>
          <View className="gap-2">
            <SettingsRow label="Хувийн мэдээлэл" subtitle="Нэр, имэйл, утас" icon="account-outline" />
            <SettingsRow
              label="Эмнэлгийн мэдээлэл"
              subtitle={clinic.registered ? clinic.name : "Эмнэлэг бүртгэх шаардлагатай"}
              icon="hospital-building"
              onPress={() => router.push(clinic.registered ? routes.providerClinicProfile : routes.providerClinicRegister)}
            />
            <SettingsRow
              label="Эмнэлгийн хаяг, холбоо барих"
              subtitle={clinic.address || "Хаяг, утас дутуу"}
              icon="map-marker-outline"
              onPress={() => router.push("/(provider)/clinic-edit")}
            />
            <SettingsRow
              label="Ажиллах цаг"
              subtitle="Цагийн хуваарь, слот удирдах"
              icon="calendar-clock-outline"
              onPress={() => router.push(routes.providerSchedule)}
            />
            <SettingsRow label="Баталгаажуулалтын төлөв" subtitle="Админы шалгалт" icon="shield-check-outline" badge={approvalLabel} />
            <SettingsRow
              label="Эмч нарын удирдлага"
              subtitle={`${doctors.length} эмч`}
              icon="stethoscope"
              onPress={() => router.push(routes.providerDoctors)}
            />
            <SettingsRow
              label="Нууц үг солих"
              subtitle="Аюулгүй байдлын тохиргоо"
              icon="lock-reset"
              onPress={() => router.push("/(provider)/provider-change-password")}
            />
          </View>
        </View>

        <Card className="mb-3">
          <Text className="text-sm font-semibold text-slate-800 dark:text-slate-100">Эмнэлгийн бүрдэл</Text>
          <Text className="mt-1 text-xs text-slate-500 dark:text-slate-400">Профайлын бүрэн байдал: {completeness}%</Text>
          <View className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <View className="h-full rounded-full bg-brand-600" style={{ width: `${completeness}%` }} />
          </View>
        </Card>
        <Card className="mb-3">
          <Text className="text-sm font-semibold text-slate-800 dark:text-slate-100">Эмнэлгийн тохиргоо</Text>
          <Text className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Эмнэлгийн нэр, хаяг, холбоо барих мэдээлэл, ажиллах цаг зэрэг бүх мэдээллийг энэ хэсгээс удирдана.
          </Text>
          <Button
            label={clinic.registered ? "Эмнэлгийн профайл нээх" : "Эмнэлгийн мэдээлэл бүртгэх"}
            variant="outline"
            className="mt-3"
            onPress={() => router.push(clinic.registered ? routes.providerClinicProfile : routes.providerClinicRegister)}
          />
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
