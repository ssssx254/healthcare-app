import {
  Badge,
  Button,
  Card,
  ErrorState,
  HeaderThemeAndLogout,
  HeaderNotificationLink,
  ListSkeleton,
  LoadingState,
  ScreenScrollView,
  SectionHeader,
  StatCard,
} from "@/components";
import { routes } from "@/constants/appRoutes";
import { providerBookingStatusLabel } from "@/constants/providerBookingStatus";
import { useAuth } from "@/hooks/useAuth";
import { useChatSync } from "@/hooks/useChatSync";
import { useProviderWorkspace } from "@/contexts/ProviderWorkspaceContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Link, router, Tabs, type Href } from "expo-router";
import { useCallback, useMemo, type ComponentProps } from "react";
import { Pressable, Text, View } from "react-native";

export default function ProviderDashboardScreen() {
  const { signOut, user } = useAuth();
  const isApproved = user?.approvalStatus === "approved";
  const approvalLabel = isApproved ? "Баталгаажсан" : user?.approvalStatus === "rejected" ? "Татгалзсан" : "Хүлээгдэж байна";
  const { conversations } = useChatSync();
  const {
    clinic,
    doctors,
    services,
    slots,
    bookings,
    workspaceError,
    workspaceLoading,
    refreshWorkspace,
    todayBookingsCount,
    pendingRequestsCount,
  } = useProviderWorkspace();

  const onLogout = useCallback(() => {
    signOut();
    router.replace(routes.login);
  }, [signOut]);

  const todayIso = new Date().toISOString().slice(0, 10);
  const todayAppointments = useMemo(
    () => bookings.filter((b) => (b.date ?? b.createdAtIso.slice(0, 10)) === todayIso).slice(0, 4),
    [bookings, todayIso],
  );
  const newRequests = useMemo(
    () =>
      bookings
        .filter((b) => b.providerStatus === "pending_request")
        .sort((a, b) => b.createdAtIso.localeCompare(a.createdAtIso))
        .slice(0, 4),
    [bookings],
  );
  const activeDoctorsCount = useMemo(
    () => doctors.filter((d) => services.some((s) => s.doctorId === d.id)).length,
    [doctors, services],
  );
  const pendingProviderChats = useMemo(
    () =>
      conversations
        .filter((c) => c.provider.id === (user?.id ?? "provider-main") || c.provider.id === "provider-main")
        .sort((a, b) => b.updatedAtIso.localeCompare(a.updatedAtIso)),
    [conversations, user?.id],
  );
  const pendingChatUnreadCount = useMemo(
    () => pendingProviderChats.reduce((acc, c) => acc + c.unreadForProvider, 0),
    [pendingProviderChats],
  );
  const serviceStatusText = useMemo(() => {
    const onlineCount = services.filter((s) => s.isOnline).length;
    const ambulatoryCount = services.filter((s) => s.isAmbulatory).length;
    return `${onlineCount} цахим · ${ambulatoryCount} амбулатор`;
  }, [services]);
  const monthRevenueMnt = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    return bookings
      .filter((b) => {
        if (b.kind !== "formal") return false;
        if (!(b.providerStatus === "confirmed" || b.providerStatus === "completed")) return false;
        const d = new Date(b.createdAtIso);
        return d.getFullYear() === y && d.getMonth() === m;
      })
      .reduce((sum, b) => sum + Number(b.priceMnt || 0), 0);
  }, [bookings]);
  const clinicMissing: string[] = useMemo(() => {
    const missing: string[] = [];
    if (!clinic.name?.trim()) missing.push("Эмнэлгийн нэр");
    if (!clinic.phone?.trim()) missing.push("Утас");
    if (!clinic.address?.trim()) missing.push("Хаяг");
    if (!clinic.description?.trim()) missing.push("Танилцуулга");
    if (doctors.length === 0) missing.push("Эмч бүртгэл");
    if (services.length === 0) missing.push("Үйлчилгээ");
    if (slots.length === 0) missing.push("Цагийн слот");
    return missing;
  }, [clinic.address, clinic.description, clinic.name, clinic.phone, doctors.length, services.length, slots.length]);
  const clinicCompleteness = useMemo(() => {
    const totalChecks = 7;
    return Math.max(0, Math.round(((totalChecks - clinicMissing.length) / totalChecks) * 100));
  }, [clinicMissing.length]);
  const summaryCards = useMemo(
    () => [
      { title: "Өнөөдрийн захиалга", value: String(todayBookingsCount), hint: "Өнөөдөр" },
      { title: "Шинэ хүсэлт", value: String(pendingRequestsCount), hint: "Яаралтай шалгах" },
      { title: "Идэвхтэй эмч", value: String(activeDoctorsCount), hint: "Үйлчилгээтэй эмч" },
      { title: "Нийт үйлчилгээ", value: String(services.length), hint: serviceStatusText },
      { title: "Сарын орлого", value: `${monthRevenueMnt.toLocaleString("mn-MN")} ₮`, hint: "Энэ сарын баталгаажсан" },
    ],
    [todayBookingsCount, pendingRequestsCount, activeDoctorsCount, services.length, serviceStatusText, monthRevenueMnt],
  );
  const summaryCardRows = useMemo(() => {
    const rows: Array<typeof summaryCards> = [];
    for (let i = 0; i < summaryCards.length; i += 2) {
      rows.push(summaryCards.slice(i, i + 2));
    }
    return rows;
  }, [summaryCards]);
  const clinicActionHref = clinic.registered ? "/clinic-profile" : "/clinic-register";
  const quickActions = useMemo<
    Array<{
      href: Href;
      label: string;
      subtitle: string;
      icon: ComponentProps<typeof MaterialCommunityIcons>["name"];
    }>
  >(
    () => [
      {
        href: routes.providerDoctorRegister,
        label: "Эмч бүртгэх",
        subtitle: "Шинэ эмч нэмэх",
        icon: "account-plus-outline",
      },
      {
        href: routes.providerOrdersRequests,
        label: "Захиалгын хүсэлт",
        subtitle: "Батлах хүсэлтүүд",
        icon: "clipboard-alert-outline",
      },
      {
        href: routes.providerChat,
        label: "Чат нээх",
        subtitle: "Үйлчлүүлэгчтэй холбогдох",
        icon: "chat-processing-outline",
      },
      {
        href: clinicActionHref,
        label: "Эмнэлгийн мэдээлэл шинэчлэх",
        subtitle: clinic.registered ? "Профайл засах" : "Эмнэлэг бүртгэх",
        icon: "hospital-building",
      },
      {
        href: routes.providerRevenue,
        label: "Статистик харах",
        subtitle: "Захиалга, орлогын тайлан",
        icon: "chart-line",
      },
    ],
    [clinic.registered, clinicActionHref],
  );

  return (
    <>
      <Tabs.Screen
        options={{
          title: "Самбар",
          headerTitle: "",
          headerLeft: () => <HeaderNotificationLink href={routes.providerNotifications} />,
          headerRight: () => <HeaderThemeAndLogout onPress={onLogout} />,
        }}
      />
      <ScreenScrollView
        className="flex-1 bg-app-bg"
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
      >
        <SectionHeader
          variant="hero"
          title="Хяналтын самбар"
          subtitle={
            clinic.registered ? `${clinic.name} · Өдөр тутмын удирдлага` : "Эмнэлгийн мэдээллээ шинэчилж, профайлаа бүрэн болгоно уу."
          }
        />

        {workspaceError ? (
          <ErrorState
            className="mb-4"
            title="Өгөгдөл ачаалагдаагүй байна"
            message={workspaceError}
            onRetry={() => void refreshWorkspace()}
            retryLabel="Дахин ачаалах"
          />
        ) : null}

        {workspaceLoading ? (
          <Card className="mb-4">
            <LoadingState
              compact
              title="Самбарын мэдээлэл ачааллаж байна…"
              subtitle="Эмнэлэг, эмч, үйлчилгээ, захиалгын өгөгдөл татагдаж байна."
            />
            <ListSkeleton rows={2} />
          </Card>
        ) : (
          <View className="mb-4">
            <Text className="mb-3 text-xs font-semibold uppercase tracking-wide text-app-text-muted">Товч үзүүлэлт</Text>
            <View className="gap-3">
              {summaryCardRows.map((row, rowIndex) => (
                <View key={`summary-row-${rowIndex}`} className="flex-row gap-3">
                  {row.map((item) => (
                    <StatCard key={item.title} className="min-h-[132px] flex-1" title={item.title} value={item.value} hint={item.hint} />
                  ))}
                </View>
              ))}
            </View>
          </View>
        )}

        {!isApproved ? (
          <Card className="mb-4 border border-amber-300 bg-amber-50 dark:border-amber-800/60 dark:bg-amber-900/20">
            <Text className="text-sm font-semibold text-amber-800 dark:text-amber-300">Профайл төлөв: {approvalLabel}</Text>
            <Text className="mt-1 text-xs leading-5 text-amber-700 dark:text-amber-200">
              Баталгаажуулалт дуусах хүртэл эмч/үйлчилгээ/захиалгын зарим үйлдэл түр хязгаарлагдсан.
            </Text>
            <Button label="Профайл нээх" className="mt-3" variant="outline" onPress={() => router.push(routes.providerProfile)} />
          </Card>
        ) : null}

        <Card className="mb-4">
          <Text className="text-sm font-semibold text-app-text">Шуурхай үйлдэл</Text>
          <View className="mt-4 flex-row flex-wrap gap-3">
            {quickActions.map((action) => (
              <Pressable
                key={action.label}
                disabled={!isApproved}
                onPress={() => {
                  if (!isApproved) return;
                  router.push(action.href);
                }}
                className={`min-h-[96px] min-w-[48%] flex-1 rounded-2xl border px-3 py-3.5 ${
                  isApproved
                    ? "border-slate-200/80 bg-slate-50/80 active:opacity-90 border-app-border bg-app-muted/70"
                    : "border-slate-200 bg-slate-100/70 opacity-60 border-app-border bg-app-card/40"
                }`}
              >
                  <View className="flex-row items-start gap-3">
                    <View className="h-10 w-10 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-900/40">
                      <MaterialCommunityIcons name={action.icon} size={22} color="#2563eb" />
                    </View>
                    <View className="min-w-0 flex-1 pt-0.5">
                      <Text className="text-[15px] font-semibold text-app-text" numberOfLines={2}>
                        {action.label}
                      </Text>
                      <Text className="mt-1 text-xs text-app-text-secondary" numberOfLines={2}>
                        {action.subtitle}
                      </Text>
                    </View>
                  </View>
                </Pressable>
            ))}
          </View>
          {!isApproved ? (
            <Text className="mt-3 text-xs text-app-text-muted">
              Баталгаажсаны дараа эдгээр үйлдэл бүрэн нээгдэнэ.
            </Text>
          ) : null}
        </Card>

        <Card className="mb-4">
          <View className="mb-3 flex-row items-center justify-between gap-2">
            <Text className="min-w-0 flex-1 text-sm font-semibold text-app-text" numberOfLines={2}>
              Өнөөдрийн цагийн товч
            </Text>
            <Link href={routes.providerOrdersToday} asChild>
              <Button label="Бүгд" variant="ghost" className="min-h-0 shrink-0 self-center px-3 py-2" />
            </Link>
          </View>
          {todayAppointments.length === 0 ? (
            <Text className="text-sm text-app-text-muted">Өнөөдөр баталгаажсан цаг хараахан алга.</Text>
          ) : (
            <View className="gap-2">
              {todayAppointments.map((b) => (
                <Pressable key={b.id} onPress={() => router.push(`/orders/${b.id}`)}>
                  <View className="rounded-xl border border-app-border bg-app-muted px-3.5 py-3 border-app-border bg-app-muted/80">
                    <Text className="text-sm font-semibold text-app-text" numberOfLines={1}>
                      {b.patientName ?? "Үйлчлүүлэгч"}
                    </Text>
                    <Text className="mt-1 text-xs text-app-text-secondary" numberOfLines={2}>
                      {b.serviceTitle}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </Card>

        <Card className="mb-4">
          <View className="mb-3 flex-row items-center justify-between gap-2">
            <Text className="min-w-0 flex-1 text-sm font-semibold text-app-text" numberOfLines={2}>
              Шинэ захиалгын хүсэлтүүд
            </Text>
            <Badge label={String(pendingRequestsCount)} tone={pendingRequestsCount > 0 ? "warning" : "neutral"} />
          </View>
          {newRequests.length === 0 ? (
            <Text className="text-sm text-app-text-muted">Хүлээгдэж буй хүсэлт алга.</Text>
          ) : (
            <View className="gap-2">
              {newRequests.map((b) => (
                <Pressable key={b.id} onPress={() => router.push(`/orders/${b.id}`)}>
                  <View className="rounded-xl border border-app-border bg-app-muted px-3.5 py-3 border-app-border bg-app-muted/80">
                    <View className="flex-row items-center justify-between gap-2">
                      <Text className="min-w-0 flex-1 text-sm font-semibold text-app-text" numberOfLines={1}>
                        {b.patientName ?? "Үйлчлүүлэгч"}
                      </Text>
                      <Badge label={providerBookingStatusLabel[b.providerStatus]} tone="warning" />
                    </View>
                    <Text className="mt-1 text-xs text-app-text-secondary" numberOfLines={2}>
                      {b.serviceTitle}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </Card>

        <Card className="mb-4">
          <View className="mb-3 flex-row items-center justify-between gap-2">
            <Text className="min-w-0 flex-1 text-sm font-semibold text-app-text" numberOfLines={2}>
              Сүүлийн чат хүсэлтүүд
            </Text>
            <Badge label={String(pendingChatUnreadCount)} tone={pendingChatUnreadCount > 0 ? "warning" : "neutral"} />
          </View>
          {pendingProviderChats.length === 0 ? (
            <Text className="text-sm text-app-text-muted">Шинэ чат хүсэлт алга.</Text>
          ) : (
            <View className="gap-2">
              {pendingProviderChats.slice(0, 4).map((c) => {
                const last = c.messages[c.messages.length - 1];
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => router.push({ pathname: routes.providerChat, params: { conversationId: c.id, patient: c.customer.name } })}
                  >
                    <View className="rounded-xl border border-app-border bg-app-muted px-3.5 py-3 border-app-border bg-app-muted/80">
                      <View className="flex-row items-center justify-between gap-2">
                        <Text className="min-w-0 flex-1 text-sm font-semibold text-app-text" numberOfLines={1}>
                          {c.customer.name}
                        </Text>
                        <Text className="shrink-0 text-[11px] text-app-text-muted">
                          {new Date(c.updatedAtIso).toLocaleTimeString("mn-MN", { hour: "2-digit", minute: "2-digit" })}
                        </Text>
                      </View>
                      <View className="mt-1 flex-row items-center justify-between gap-2">
                        <Text className="min-w-0 flex-1 text-xs text-app-text-secondary" numberOfLines={2}>
                          {last?.text ?? "Мессеж алга"}
                        </Text>
                        <Badge label={`${c.unreadForProvider}`} tone={c.unreadForProvider > 0 ? "warning" : "neutral"} />
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </Card>

        <Card>
          <Text className="text-sm font-semibold text-app-text">Эмнэлгийн төлөв</Text>
          <View className="mt-3 flex-row items-center justify-between">
            <Text className="text-xs text-app-text-muted">Баталгаажуулалтын төлөв</Text>
            <Badge
              label={user?.approvalStatus === "approved" ? "Баталгаажсан" : user?.approvalStatus === "rejected" ? "Татгалзсан" : "Шалгалтад"}
              tone={user?.approvalStatus === "approved" ? "success" : "warning"}
            />
          </View>
          <View className="mt-2 flex-row items-center justify-between">
            <Text className="text-xs text-app-text-muted">Профайлын бүрдэлт</Text>
            <Text className="text-sm font-semibold text-app-text">{clinicCompleteness}%</Text>
          </View>
          {clinicMissing.length > 0 ? (
            <View className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-900/50 dark:bg-amber-900/20">
              <Text className="text-xs font-medium text-amber-700 dark:text-amber-300">Дутуу мэдээлэл</Text>
              <Text className="mt-1 text-xs text-amber-700 dark:text-amber-300" numberOfLines={4}>
                {clinicMissing.join(", ")}
              </Text>
            </View>
          ) : (
            <Text className="mt-3 text-xs text-emerald-600 dark:text-emerald-400">
              Профайл бүрэн байна. Үйл ажиллагаа хэвийн.
            </Text>
          )}
          <Button
            label="Профайл сайжруулах"
            variant="outline"
            className="mt-3"
            onPress={() => router.push(clinic.registered ? routes.providerClinicProfile : routes.providerClinicRegister)}
          />
        </Card>
      </ScreenScrollView>
    </>
  );
}
