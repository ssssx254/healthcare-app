import { Badge, Card, LoadingState } from "@/components";
import { AppImage } from "@/components/AppImage";
import { getLabTestSourceLabel, getLabTestStatusLabel, labTestStatusTone } from "@/constants/labTestStatus";
import { labTestsApi, type LabTestRow } from "@/services/api/labTestsApi";
import { toFriendlyErrorMn } from "@/lib/friendlyErrorMn";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";

type Props = {
  title?: string;
  emptyText?: string;
  /** Захиалгын ID — provider захиалгын дэлгэрэнгүй */
  bookingId?: string;
  /** Өвчтөний user ID — өвчтөний дэлгэрэнгүй */
  patientUserId?: number;
};

export function SharedLabTestsCard({
  title = "Хуваалцсан шинжилгээ",
  emptyText = "Энэ захиалгад үйлчлүүлэгч шинжилгээ хуваалаагүй байна.",
  bookingId,
  patientUserId,
}: Props) {
  const [items, setItems] = useState<LabTestRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!bookingId && !patientUserId) return;
      setLoading(true);
      setError(null);
      try {
        let rows: LabTestRow[] = [];
        if (bookingId && !isNaN(Number(bookingId))) {
          const { bookingApi } = await import("@/services/api/bookingApi");
          const res = await bookingApi.listSharedLabTests(bookingId);
          rows = res.items ?? [];
        } else if (patientUserId) {
          const res = await labTestsApi.listForProvider({ patient_user_id: patientUserId });
          rows = res.items ?? [];
        }
        if (alive) setItems(rows);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Ачааллахад алдаа гарлаа.";
        if (alive) {
          setError(toFriendlyErrorMn(msg));
          setItems([]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    }
    void load();
    return () => {
      alive = false;
    };
  }, [bookingId, patientUserId]);

  return (
    <Card className="mb-3">
      <Text className="text-sm font-semibold text-app-text">{title}</Text>
      <Text className="mt-1 text-xs text-app-text-muted">Зөвхөн үйлчлүүлэгч сонгож хуваалсан файлууд.</Text>

      {loading ? (
        <View className="mt-2">
          <LoadingState compact title="Ачааллаж байна…" />
        </View>
      ) : null}

      {error ? <Text className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</Text> : null}

      {!loading && !error && items.length === 0 ? (
        <Text className="mt-2 text-xs text-app-text-muted">{emptyText}</Text>
      ) : null}

      {!error && items.length > 0 ? (
        <View className="mt-2 gap-2">
          {items.map((lt) => (
            <Pressable
              key={lt.id}
              onPress={() =>
                router.push(`/(provider)/lab-tests/${lt.id}` as never)
              }
            >
              <View className="rounded-xl border border-app-border bg-app-muted/80 px-3 py-2.5">
                <View className="flex-row items-center justify-between gap-2">
                  <Text className="flex-1 text-sm font-medium text-app-text" numberOfLines={1}>
                    {lt.title}
                  </Text>
                  <Badge
                    label={getLabTestStatusLabel(lt.status, lt.uploaded_by)}
                    tone={labTestStatusTone(lt.status, lt.uploaded_by)}
                  />
                </View>
                <Text className="mt-1 text-xs text-app-text-muted">
                  {getLabTestSourceLabel(lt.uploaded_by)} · {lt.test_type} · {lt.test_date}
                </Text>
                {lt.result_text?.trim() ? (
                  <Text className="mt-2 text-xs text-app-text-secondary" numberOfLines={3}>
                    {lt.result_text}
                  </Text>
                ) : null}
                {lt.attachment_url && (lt.attachment_type === "image" || lt.attachment_url.startsWith("data:image")) ? (
                  <AppImage
                    source={{ uri: lt.attachment_url }}
                    fallbackIcon="file-image-outline"
                    className="mt-2 h-24 w-full max-w-xs rounded-lg border border-app-border"
                  />
                ) : null}
                {lt.result_file_url ? (
                  <Text className="mt-1 text-xs text-brand-600 dark:text-brand-300">Үр дүнгийн файл хавсаргасан</Text>
                ) : null}
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}
    </Card>
  );
}
