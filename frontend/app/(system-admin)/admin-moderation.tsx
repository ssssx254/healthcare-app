import { Badge, Button, Card, Input, ScreenScrollView, SectionHeader } from "@/components";
import { toFriendlyErrorMn } from "@/lib/friendlyErrorMn";
import { adminApi, type AdminContentReportRow, type AdminFeaturedRow } from "@/services/api/adminApi";
import { Tabs } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";

export default function AdminModerationScreen() {
  const [reports, setReports] = useState<AdminContentReportRow[]>([]);
  const [featured, setFeatured] = useState<AdminFeaturedRow[]>([]);
  const [clinicIdText, setClinicIdText] = useState("");
  const [reportStatusFilter, setReportStatusFilter] = useState<"open" | "reviewing" | "resolved" | "dismissed">("open");
  const [reportNoteById, setReportNoteById] = useState<Record<number, string>>({});
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);
  const [featuredError, setFeaturedError] = useState<string | null>(null);
  const [featuredLoading, setFeaturedLoading] = useState(false);
  const [broadcastAudience, setBroadcastAudience] = useState<"all" | "customer" | "provider" | "system_admin">("all");
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<string | null>(null);

  const loadFeatured = async () => {
    setFeaturedLoading(true);
    setFeaturedError(null);
    try {
      const items = await adminApi.listFeaturedItems();
      setFeatured(items);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Онцлох контент ачаалахад алдаа гарлаа.";
      setFeaturedError(toFriendlyErrorMn(msg));
      setFeatured([]);
    } finally {
      setFeaturedLoading(false);
    }
  };

  const loadReports = async () => {
    setReportsLoading(true);
    setReportsError(null);
    try {
      const { items } = await adminApi.listContentReports({ status: reportStatusFilter, page: 1, page_size: 100 });
      setReports(items);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Гомдлын жагсаалт ачаалахад алдаа гарлаа.";
      setReportsError(toFriendlyErrorMn(msg));
      setReports([]);
    } finally {
      setReportsLoading(false);
    }
  };

  useEffect(() => {
    void loadFeatured();
  }, []);

  useEffect(() => {
    void loadReports();
  }, [reportStatusFilter]);

  const onAddClinicFeatured = async () => {
    const clinicId = Number(clinicIdText);
    if (!Number.isInteger(clinicId) || clinicId <= 0) {
      setFeaturedError("Эмнэлгийн ID зөв оруулна уу.");
      return;
    }
    setFeaturedError(null);
    setFeaturedLoading(true);
    try {
      await adminApi.createFeaturedClinic(clinicId, 0);
      setClinicIdText("");
      await loadFeatured();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Онцлох эмнэлэг нэмэхэд алдаа гарлаа.";
      setFeaturedError(toFriendlyErrorMn(msg));
    } finally {
      setFeaturedLoading(false);
    }
  };

  const changeReportStatus = async (item: AdminContentReportRow, status: "reviewing" | "resolved" | "dismissed") => {
    setReportsError(null);
    try {
      const updated = await adminApi.patchContentReport(item.id, {
        status,
        admin_notes: reportNoteById[item.id]?.trim() || null,
      });
      setReports((prev) => prev.map((r) => (r.id === item.id ? updated : r)));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Гомдлын төлөв шинэчлэхэд алдаа гарлаа.";
      setReportsError(toFriendlyErrorMn(msg));
    }
  };

  const onBroadcast = async () => {
    const title = broadcastTitle.trim();
    const message = broadcastMessage.trim();
    if (!title || !message) {
      setBroadcastResult("Гарчиг болон мессежээ бүрэн оруулна уу.");
      return;
    }
    setBroadcastLoading(true);
    setBroadcastResult(null);
    try {
      const data = await adminApi.broadcastNotification({
        audience: broadcastAudience,
        title,
        message,
        type: "admin_broadcast",
      });
      setBroadcastTitle("");
      setBroadcastMessage("");
      setBroadcastResult(`Амжилттай илгээлээ: ${data.sent_count} хэрэглэгч (${data.push_ready_count} push-ready).`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Мэдэгдэл илгээхэд алдаа гарлаа.";
      const friendly = toFriendlyErrorMn(msg);
      if (/зам олдсонгүй/i.test(friendly)) {
        setBroadcastResult("Зам олдсонгүй: backend серверээ restart хийгээд дахин оролдоно уу.");
      } else {
        setBroadcastResult(friendly);
      }
    } finally {
      setBroadcastLoading(false);
    }
  };

  const reportFilterButtons = useMemo(
    () => [
      { id: "open", label: "Нээлттэй" },
      { id: "reviewing", label: "Шалгаж буй" },
      { id: "resolved", label: "Шийдсэн" },
      { id: "dismissed", label: "Хаасан" },
    ] as const,
    [],
  );

  return (
    <>
      <Tabs.Screen options={{ title: "Хяналт" }} />
      <ScreenScrollView className="flex-1 bg-app-bg" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <SectionHeader title="Гомдол ба контентын хяналт" subtitle="Илгээсэн гомдол, зөрчлийг шийдвэрлэнэ." />
        <Card className="mb-4">
          <Text className="text-sm font-semibold text-app-text">Push мэдэгдэл илгээх</Text>
          <Text className="mt-1 text-xs text-app-text-muted">Сонгосон бүлгийн хэрэглэгчдэд системийн мэдэгдэл илгээнэ.</Text>
          <View className="mt-3 flex-row flex-wrap gap-2">
            {[
              { id: "all", label: "Бүгд" },
              { id: "customer", label: "Үйлчлүүлэгч" },
              { id: "provider", label: "Үзүүлэгч" },
              { id: "system_admin", label: "Админ" },
            ].map((a) => {
              const active = broadcastAudience === a.id;
              return (
                <Button
                  key={a.id}
                  label={a.label}
                  variant={active ? "primary" : "outline"}
                  className="w-[48%] min-w-[140px]"
                  onPress={() => setBroadcastAudience(a.id as typeof broadcastAudience)}
                />
              );
            })}
          </View>
          <Input label="Гарчиг" value={broadcastTitle} onChangeText={setBroadcastTitle} placeholder="Ж: Системийн анхааруулга" className="mt-3" />
          <Input
            label="Мессеж"
            value={broadcastMessage}
            onChangeText={setBroadcastMessage}
            placeholder="Мэдэгдлийн агуулга..."
            className="mt-2"
          />
          <Button label="Мэдэгдэл илгээх" className="mt-3" loading={broadcastLoading} onPress={() => void onBroadcast()} />
          {broadcastResult ? <Text className="mt-2 text-xs text-app-text-secondary">{broadcastResult}</Text> : null}
        </Card>

        <Card className="mb-4">
          <Text className="text-sm font-semibold text-app-text">Гомдлын төлөв</Text>
          <View className="mt-3 flex-row flex-wrap gap-2">
            {reportFilterButtons.map((f) => {
              const active = reportStatusFilter === f.id;
              return (
                <Button
                  key={f.id}
                  label={f.label}
                  variant={active ? "primary" : "outline"}
                  className="w-[48%] min-w-[140px]"
                  onPress={() => setReportStatusFilter(f.id)}
                />
              );
            })}
          </View>
        </Card>

        {reportsError ? (
          <Card className="mb-3 border border-rose-200 bg-rose-50 dark:border-rose-900/40 dark:bg-rose-950/30">
            <Text className="text-xs text-rose-700 dark:text-rose-300">{reportsError}</Text>
            <Button label="Дахин ачаалах" variant="outline" className="mt-2" onPress={() => void loadReports()} />
          </Card>
        ) : null}

        {reportsLoading ? (
          <Card className="mb-3">
            <Text className="text-sm text-app-text-muted">Гомдлууд ачааллаж байна…</Text>
          </Card>
        ) : null}
        <View className="gap-3">
          {reports.map((item) => (
            <Card key={item.id}>
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-semibold text-app-text">Гомдол #{item.id}</Text>
                <Badge label={item.status} tone={item.status === "open" ? "warning" : item.status === "resolved" ? "success" : "neutral"} />
              </View>
              <Text className="mt-1 text-xs text-app-text-muted">
                Төрөл: {item.target_type === "clinic" ? "Эмнэлэг" : item.target_type === "doctor" ? "Эмч" : "Нийтлэл"}
              </Text>
              <Text className="mt-1 text-xs text-app-text-muted">Reporter: {item.reporter_full_name ?? item.reporter_email ?? "—"}</Text>
              <Text className="mt-1 text-xs text-app-text-muted">Шалтгаан: {item.reason_code}</Text>
              {item.details ? <Text className="mt-1 text-xs text-app-text-muted">Дэлгэрэнгүй: {item.details}</Text> : null}
              <Text className="mt-1 text-xs text-app-text-muted">Огноо: {new Date(item.created_at).toLocaleString("mn-MN")}</Text>
              <Input
                label="Админы тэмдэглэл"
                value={reportNoteById[item.id] ?? item.admin_notes ?? ""}
                onChangeText={(v) => setReportNoteById((prev) => ({ ...prev, [item.id]: v }))}
                placeholder="Шийдвэрийн тайлбар..."
                className="mt-2"
              />
              <View className="mt-3 flex-row gap-2">
                <Button
                  label="Шалгаж буй"
                  variant="outline"
                  className="flex-1"
                  onPress={() => void changeReportStatus(item, "reviewing")}
                />
                <Button label="Шийдвэрлэх" className="flex-1" onPress={() => void changeReportStatus(item, "resolved")} />
                <Button label="Хаах" variant="secondary" className="flex-1" onPress={() => void changeReportStatus(item, "dismissed")} />
              </View>
            </Card>
          ))}
        </View>

        <Card className="mt-4">
          <Text className="text-sm font-semibold text-app-text">Онцлох контентын удирдлага</Text>
          <Text className="mt-1 text-xs text-app-text-muted">
            Backend бүтцээр дэмжигдсэн үед platform featured items-ийг эндээс удирдана.
          </Text>
          <Input
            label="Онцлох эмнэлгийн ID"
            value={clinicIdText}
            onChangeText={setClinicIdText}
            keyboardType="number-pad"
            placeholder="Ж: 12"
            className="mt-3"
          />
          <Button label="Онцлох эмнэлэг нэмэх" className="mt-2" loading={featuredLoading} onPress={() => void onAddClinicFeatured()} />
          {featuredError ? <Text className="mt-2 text-xs text-rose-700 dark:text-rose-300">{featuredError}</Text> : null}

          <View className="mt-3 gap-2">
            {featured.length === 0 && !featuredLoading ? (
              <Text className="text-xs text-app-text-muted">Онцлох контент одоогоор алга.</Text>
            ) : null}
            {featured.map((f) => (
              <Card key={String(f.id)} className="border border-app-border">
                <View className="flex-row items-center justify-between gap-2">
                  <Text className="min-w-0 flex-1 text-sm font-semibold text-app-text" numberOfLines={1}>
                    {f.item_type === "clinic" ? `Эмнэлэг #${f.clinic_id ?? "—"}` : f.article_title ?? "Нийтлэл"}
                  </Text>
                  <Badge label={f.is_active ? "Идэвхтэй" : "Идэвхгүй"} tone={f.is_active ? "success" : "neutral"} />
                </View>
                <View className="mt-2 flex-row gap-2">
                  <Button
                    label={f.is_active ? "Идэвхгүй болгох" : "Идэвхжүүлэх"}
                    variant="outline"
                    className="flex-1"
                    onPress={() => void adminApi.patchFeatured(f.id, { is_active: !Boolean(f.is_active) }).then(loadFeatured)}
                  />
                  <Button
                    label="Устгах"
                    variant="secondary"
                    className="flex-1"
                    onPress={() => void adminApi.deleteFeatured(f.id).then(loadFeatured)}
                  />
                </View>
              </Card>
            ))}
          </View>
        </Card>
      </ScreenScrollView>
    </>
  );
}

