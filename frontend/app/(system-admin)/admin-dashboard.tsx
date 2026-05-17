import { Badge, Button, Card, ScreenScrollView, SectionHeader } from "@/components";
import { routes } from "@/constants/appRoutes";
import { adminApi } from "@/services/api/adminApi";
import { statsApi } from "@/services/api/statsApi";
import { ApiError } from "@/lib/api/client";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Link, Tabs, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

export default function SystemAdminDashboardScreen() {
  const [pendingProviders, setPendingProviders] = useState<number | null>(null);
  const [pendingClinics, setPendingClinics] = useState<number | null>(null);
  const [openReports, setOpenReports] = useState<number | null>(null);
  const [totalProviders, setTotalProviders] = useState<number | null>(null);
  const [totalCustomers, setTotalCustomers] = useState<number | null>(null);
  const [totalBookings, setTotalBookings] = useState<number | null>(null);
  const [featuredItems, setFeaturedItems] = useState<number | null>(null);
  const [adminTotalUsers, setAdminTotalUsers] = useState<number | null>(null);
  const [adminTotalProviders, setAdminTotalProviders] = useState<number | null>(null);
  const [adminPendingClinics, setAdminPendingClinics] = useState<number | null>(null);
  const [adminTotalBookings, setAdminTotalBookings] = useState<number | null>(null);
  const [adminRevenueTotal, setAdminRevenueTotal] = useState<number | null>(null);
  const [clinicRevenueRows, setClinicRevenueRows] = useState<
    Array<{ clinic_id: number; clinic_name: string; paid_bookings_count: number; paid_revenue_total: number }>
  >([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoadError(null);
    setLoading(true);
    try {
      const [dashboardResult, statsResult] = await Promise.allSettled([adminApi.getDashboard(), statsApi.admin()]);
      if (dashboardResult.status !== "fulfilled") {
        throw dashboardResult.reason;
      }
      const d = dashboardResult.value;
      setPendingProviders(d.platform.pending_provider_registrations);
      setPendingClinics(d.platform.pending_clinics);
      setOpenReports(d.platform.open_content_reports);
      setTotalProviders(d.platform.total_providers);
      setTotalCustomers(d.platform.total_customers);
      setTotalBookings(d.platform.total_bookings);
      setFeaturedItems(d.platform.active_featured_items);
      if (statsResult.status === "fulfilled") {
        setAdminTotalUsers(statsResult.value.total_users);
        setAdminTotalProviders(statsResult.value.total_providers);
        setAdminPendingClinics(statsResult.value.pending_clinics);
        setAdminTotalBookings(statsResult.value.total_bookings);
        setAdminRevenueTotal(statsResult.value.paid_revenue_total);
        setClinicRevenueRows(statsResult.value.clinic_paid_revenue ?? []);
      } else {
        setAdminTotalUsers(null);
        setAdminTotalProviders(null);
        setAdminPendingClinics(null);
        setAdminTotalBookings(null);
        setAdminRevenueTotal(null);
        setClinicRevenueRows([]);
      }
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Самбар ачаалахад алдаа.";
      setLoadError(msg);
      setPendingProviders(null);
      setPendingClinics(null);
      setOpenReports(null);
      setTotalProviders(null);
      setTotalCustomers(null);
      setTotalBookings(null);
      setFeaturedItems(null);
      setAdminTotalUsers(null);
      setAdminTotalProviders(null);
      setAdminPendingClinics(null);
      setAdminTotalBookings(null);
      setAdminRevenueTotal(null);
      setClinicRevenueRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const n = (v: number | null) => (v == null ? "—" : String(v));
  const money = (v: number | null) => (v == null ? "—" : `${v.toLocaleString("mn-MN")} ₮`);
  const statCards = [
    { key: "pendingProviders", label: "Хүлээгдэж буй үзүүлэгч", value: n(pendingProviders), icon: "account-clock-outline" },
    { key: "pendingClinics", label: "Хүлээгдэж буй эмнэлэг", value: n(pendingClinics), icon: "hospital-building" },
    { key: "openReports", label: "Нээлттэй гомдол", value: n(openReports), icon: "alert-circle-outline" },
    { key: "totalProviders", label: "Нийт үзүүлэгч", value: n(totalProviders), icon: "account-tie-outline" },
    { key: "totalCustomers", label: "Нийт хэрэглэгч", value: n(totalCustomers), icon: "account-group-outline" },
    { key: "totalBookings", label: "Нийт захиалга", value: n(totalBookings), icon: "calendar-check-outline" },
    { key: "featuredItems", label: "Идэвхтэй онцлох", value: n(featuredItems), icon: "star-outline" },
  ] as const;

  return (
    <>
      <Tabs.Screen options={{ title: "Системийн админы самбар" }} />
      <ScreenScrollView className="flex-1 bg-slate-50 dark:bg-slate-950" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <SectionHeader title="Системийн админы самбар" subtitle="Платформын бүртгэл, хяналт, удирдлага." />

        {loadError ? (
          <Card className="mb-4 border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/30">
            <Text className="text-sm text-amber-900 dark:text-amber-100">{loadError}</Text>
            <Button label="Дахин оролдох" variant="outline" className="mt-3" onPress={() => void load()} />
          </Card>
        ) : null}

        {loading ? (
          <View className="mb-4 items-center py-6">
            <ActivityIndicator size="large" />
          </View>
        ) : null}

        <View className="mb-4 flex-row flex-wrap gap-3">
          {statCards.map((item) => (
            <Card key={item.key} className="min-w-[48%] flex-1">
              <View className="flex-row items-center justify-between">
                <Text className="flex-1 pr-2 text-xs text-slate-500 dark:text-slate-400">{item.label}</Text>
                <MaterialCommunityIcons name={item.icon} size={18} color="#14b8a6" />
              </View>
              <Text className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-50">{item.value}</Text>
            </Card>
          ))}
        </View>

        <Card className="mb-4">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-slate-900 dark:text-slate-50">Тайлан / статистик</Text>
            <MaterialCommunityIcons name="chart-box-outline" size={18} color="#14b8a6" />
          </View>
          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-slate-500 dark:text-slate-400">Нийт хэрэглэгч</Text>
              <Text className="text-sm font-semibold text-slate-900 dark:text-slate-50">{n(adminTotalUsers)}</Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-slate-500 dark:text-slate-400">Нийт үзүүлэгч</Text>
              <Text className="text-sm font-semibold text-slate-900 dark:text-slate-50">{n(adminTotalProviders)}</Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-slate-500 dark:text-slate-400">Хүлээгдэж буй эмнэлэг</Text>
              <Text className="text-sm font-semibold text-slate-900 dark:text-slate-50">{n(adminPendingClinics)}</Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-slate-500 dark:text-slate-400">Нийт захиалга</Text>
              <Text className="text-sm font-semibold text-slate-900 dark:text-slate-50">{n(adminTotalBookings)}</Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-slate-500 dark:text-slate-400">Төлөгдсөн нийт орлого</Text>
              <Text className="text-sm font-semibold text-slate-900 dark:text-slate-50">{money(adminRevenueTotal)}</Text>
            </View>
          </View>
        </Card>

        <Card className="mb-4">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-slate-900 dark:text-slate-50">Эмнэлэг тус бүрийн төлөгдсөн орлого</Text>
            <MaterialCommunityIcons name="hospital-building" size={18} color="#14b8a6" />
          </View>
          {clinicRevenueRows.length === 0 ? (
            <Text className="text-xs text-slate-500 dark:text-slate-400">Орлогын эмнэлгийн задлан мэдээлэл алга.</Text>
          ) : (
            <View className="gap-2">
              {clinicRevenueRows.slice(0, 12).map((row, index) => (
                <View key={row.clinic_id} className="flex-row items-center justify-between rounded-xl bg-slate-100 px-3 py-2 dark:bg-slate-800">
                  <View className="min-w-0 flex-1 pr-2">
                    <Text className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                      {index + 1}. {row.clinic_name}
                    </Text>
                    <Text className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                      Төлөгдсөн захиалга: {row.paid_bookings_count}
                    </Text>
                  </View>
                  <Text className="text-xs font-semibold text-slate-900 dark:text-slate-50">
                    {row.paid_revenue_total.toLocaleString("mn-MN")} ₮
                  </Text>
                </View>
              ))}
            </View>
          )}
        </Card>

        <Card className="mb-4">
          <Text className="text-sm font-semibold text-slate-900 dark:text-slate-50">Түргэн үйлдэл</Text>
          <View className="mt-3 gap-2">
            <Link href={routes.adminRegistrations} asChild>
              <Button label="Бүртгэл батлах" />
            </Link>
            <Link href={routes.adminProviders} asChild>
              <Button label="Үзүүлэгч удирдах" variant="outline" />
            </Link>
            <Link href={routes.adminUsers} asChild>
              <Button label="Хэрэглэгчид" variant="outline" />
            </Link>
            <Link href={routes.adminModeration} asChild>
              <Button label="Гомдол, онцлох" variant="outline" />
            </Link>
          </View>
        </Card>

        <Card>
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-slate-900 dark:text-slate-50">Хүлээгдэж буй үзүүлэгч</Text>
            <Badge label={n(pendingProviders)} tone={pendingProviders != null && pendingProviders > 0 ? "warning" : "neutral"} />
          </View>
          <Text className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Дэлгэрэнгүйг «Үзүүлэгчийн бүртгэл батлах»-аас нээнэ үү.
          </Text>
        </Card>
      </ScreenScrollView>
    </>
  );
}
