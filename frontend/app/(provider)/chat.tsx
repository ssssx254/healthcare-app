import { AppImage, Badge, Card, EmptyState, ErrorState, LoadingState, ScreenScrollView, SectionHeader } from "@/components";
import { routes } from "@/constants/appRoutes";
import { useChatSync } from "@/hooks/useChatSync";
import { useAuth } from "@/hooks/useAuth";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useFocusEffect } from "@react-navigation/native";
import { router, Stack } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

export default function ProviderChatScreen() {
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const { conversations, refreshConversations } = useChatSync();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const providerId = String(user?.id ?? "");
  const providerConversations = useMemo(
    () =>
      conversations
        .filter((c) => c.provider.id === providerId)
        .sort((a, b) => b.updatedAtIso.localeCompare(a.updatedAtIso)),
    [conversations, providerId],
  );
  useFocusEffect(
    useCallback(() => {
      void refreshConversations();
    }, [refreshConversations]),
  );
  const onReload = async () => {
    setLoading(true);
    setError(null);
    try {
      await refreshConversations();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Чатын жагсаалт ачаалахад алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: "Чатын самбар", headerTitle: "" }} />
      <ScreenScrollView
        className="flex-1 bg-slate-50 dark:bg-slate-950"
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
      >
        <SectionHeader title="Чатын самбар" subtitle="Үйлчлүүлэгчдийн ирсэн чат, уншаагүй зурвас, сүүлийн хариуг нэг дороос харна." />
        {!isOnline ? (
          <Card className="mb-3 border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20">
            <Text className="text-xs text-amber-700 dark:text-amber-300">
              Интернетгүй тул зурвас илгээх боломжгүй
            </Text>
          </Card>
        ) : null}
        {error ? (
          <ErrorState title="Чат ачаалагдсангүй" message={error} onRetry={() => void onReload()} />
        ) : loading ? (
          <Card>
            <LoadingState compact title="Чатын жагсаалт ачаалж байна…" subtitle="Түр хүлээнэ үү." />
          </Card>
        ) : providerConversations.length === 0 ? (
          <Card className="overflow-hidden">
            <EmptyState
              icon="forum-outline"
              title="Одоогоор чат байхгүй байна"
              description="Үйлчлүүлэгч чат эхлүүлэхэд энд жагсаалт үүснэ."
              action={{ label: "Дахин ачаалах", onPress: () => void onReload(), variant: "outline" }}
            />
          </Card>
        ) : (
          <View className="gap-2">
            {providerConversations.map((c) => {
              const last = c.messages[c.messages.length - 1];
              const lastTime = new Date(c.updatedAtIso).toLocaleTimeString("mn-MN", { hour: "2-digit", minute: "2-digit" });
              return (
                <Pressable
                  key={c.id}
                  onPress={() => router.push({ pathname: routes.providerChatDetail, params: { conversationId: c.id } })}
                >
                  <Card>
                    <View className="flex-row items-center gap-3">
                      <AppImage
                        source={{
                          uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(c.customer.name)}&background=0f172a&color=ffffff&size=96`,
                        }}
                        fallbackIcon="account-circle-outline"
                        className="h-11 w-11 rounded-xl"
                      />
                      <View className="min-w-0 flex-1">
                        <View className="flex-row items-center justify-between">
                          <Text className="min-w-0 flex-1 text-sm font-semibold text-slate-900 dark:text-slate-50" numberOfLines={1}>
                            {c.customer.name}
                          </Text>
                          <Text className="ml-2 text-[11px] text-slate-500 dark:text-slate-400">{lastTime}</Text>
                        </View>
                        <View className="mt-1 flex-row items-center justify-between gap-2">
                          <Text className="min-w-0 flex-1 text-xs text-slate-500 dark:text-slate-400" numberOfLines={1}>
                            {last?.text || "Сүүлд ирсэн мессеж алга"}
                          </Text>
                          <Badge label={String(c.unreadForProvider)} tone={c.unreadForProvider > 0 ? "warning" : "neutral"} />
                        </View>
                      </View>
                    </View>
                  </Card>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScreenScrollView>
    </>
  );
}
