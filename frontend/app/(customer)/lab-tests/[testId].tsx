import { Badge, Button, Card, ErrorState, LoadingState, ScreenScrollView, SectionHeader } from "@/components";
import { AppImage } from "@/components/AppImage";
import { labTestStatusLabel, labTestStatusTone } from "@/constants/labTestStatus";
import { labTestsApi, type LabTestRow } from "@/services/api/labTestsApi";
import { toFriendlyErrorMn } from "@/lib/friendlyErrorMn";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { Stack, router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";

function FileBlock({ label, url, type }: { label: string; url: string | null; type: string | null }) {
  if (!url?.trim()) {
    return (
      <View className="mt-2">
        <Text className="text-xs font-medium text-app-text-secondary">{label}</Text>
        <Text className="mt-1 text-xs text-app-text-muted">Файл хавсаргаагүй</Text>
      </View>
    );
  }
  const isImage = type === "image" || url.startsWith("data:image/");
  return (
    <View className="mt-3">
      <Text className="text-xs font-medium text-app-text-secondary">{label}</Text>
      {isImage ? (
        <AppImage
          source={{ uri: url }}
          fallbackIcon="file-image-outline"
          className="mt-2 h-40 w-full max-w-sm rounded-xl border border-app-border"
        />
      ) : (
        <Pressable
          onPress={() => {
            if (url.startsWith("http")) void Linking.openURL(url);
          }}
          className="mt-2 rounded-xl border border-app-border bg-app-muted/80 px-3 py-3"
        >
          <Text className="text-sm text-app-text">PDF / файл хавсаргасан</Text>
        </Pressable>
      )}
    </View>
  );
}

export default function CustomerLabTestDetailScreen() {
  const { testId } = useLocalSearchParams<{ testId: string }>();
  const { isOnline, cacheServedAt } = useNetworkStatus();
  const [row, setRow] = useState<LabTestRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!testId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await labTestsApi.getMine(testId);
      setRow(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Ачааллахад алдаа гарлаа.";
      setError(toFriendlyErrorMn(msg));
      setRow(null);
    } finally {
      setLoading(false);
    }
  }, [testId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <>
      <Stack.Screen options={{ title: "Шинжилгээ" }} />
      <ScreenScrollView className="flex-1 bg-app-bg" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <SectionHeader title={row?.title ?? "Шинжилгээ"} subtitle="Хариу, эмчийн тэмдэглэл, хавсралт." />

        {!isOnline ? (
          <Card className="mb-4 border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950">
            <Text className="text-xs text-amber-900 dark:text-amber-100">
              Офлайн горим{cacheServedAt ? " — кэшээс харуулж байж болно" : ""}.
            </Text>
          </Card>
        ) : null}

        {error ? (
          <ErrorState className="mb-4" title="Ачаалагдаагүй" message={error} onRetry={() => void load()} retryLabel="Дахин оролдох" />
        ) : null}

        {loading && !row && !error ? (
          <Card className="mb-4">
            <LoadingState compact title="Ачааллаж байна…" />
          </Card>
        ) : null}

        {row ? (
          <Card>
            <View className="flex-row items-center justify-between gap-2">
              <Text className="flex-1 text-base font-semibold text-app-text">{row.title}</Text>
              <Badge label={labTestStatusLabel[row.status]} tone={labTestStatusTone(row.status)} />
            </View>
            <Text className="mt-2 text-xs text-app-text-muted">
              {row.test_type} · {row.test_date}
              {row.clinic_name ? ` · ${row.clinic_name}` : ""}
            </Text>
            {row.description ? (
              <Text className="mt-3 text-sm text-app-text-secondary">{row.description}</Text>
            ) : null}

            <View className="mt-4 border-t border-app-border pt-3">
              <Text className="text-sm font-semibold text-app-text">Шинжилгээний хариу</Text>
              <Text className="mt-2 text-sm text-app-text-secondary">
                {row.result_text?.trim() ? row.result_text : "Одоогоор хариу бүртгэгдээгүй байна."}
              </Text>
              <FileBlock label="Үр дүнгийн файл" url={row.result_file_url} type={row.result_file_type} />
            </View>

            <View className="mt-4 border-t border-app-border pt-3">
              <Text className="text-sm font-semibold text-app-text">Эмчийн тэмдэглэл</Text>
              <Text className="mt-2 text-sm text-app-text-secondary">
                {row.doctor_notes?.trim() ? row.doctor_notes : "Тэмдэглэл байхгүй."}
              </Text>
            </View>

            <View className="mt-4 border-t border-app-border pt-3">
              <Text className="text-sm font-semibold text-app-text">Хавсаргасан файл</Text>
              <FileBlock label="Таны хавсралт" url={row.attachment_url} type={row.attachment_type} />
            </View>
          </Card>
        ) : null}

        <Button label="Буцах" variant="ghost" className="mt-4" onPress={() => router.back()} />
      </ScreenScrollView>
    </>
  );
}
