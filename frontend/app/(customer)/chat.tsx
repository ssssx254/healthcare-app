import { AppImage, Badge, Button, Card, EmptyState, ErrorState, LoadingState, ScreenScrollView, SectionHeader } from "@/components";
import { useChatSync } from "@/hooks/useChatSync";
import { useAuth } from "@/hooks/useAuth";
import { routes } from "@/constants/appRoutes";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { router, Stack } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

export default function ChatScreen() {
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const { conversations, refreshConversations } = useChatSync();
  const [chatError, setChatError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const myConversations = useMemo(
    () => conversations.filter((c) => c.customer.id === String(user?.id ?? "")),
    [conversations, user?.id],
  );
  useFocusEffect(
    useCallback(() => {
      void refreshConversations();
    }, [refreshConversations]),
  );

  const onReload = async () => {
    setLoading(true);
    setChatError(null);
    try {
      await refreshConversations();
    } catch (e) {
      setChatError(e instanceof Error ? e.message : "Чатын жагсаалт ачаалахад алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: "Чат" }} />
      <ScreenScrollView
        className="flex-1 bg-slate-50 dark:bg-slate-950"
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
      >
        <SectionHeader title="Миний чат" subtitle="Үзүүлэгчтэй хийсэн онлайн зөвлөгөөний ярианууд." />
        {!isOnline ? (
          <Card className="mb-3 border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20">
            <Text className="text-xs text-amber-700 dark:text-amber-300">
              Интернетгүй тул зурвас илгээх боломжгүй
            </Text>
          </Card>
        ) : null}
        {chatError ? <ErrorState title="Чат ачаалагдсангүй" message={chatError} onRetry={() => void onReload()} /> : null}
        {loading ? (
          <Card>
            <LoadingState compact title="Ярианы жагсаалт ачаалж байна…" subtitle="Түр хүлээнэ үү." />
          </Card>
        ) : myConversations.length === 0 ? (
          <Card className="overflow-hidden">
            <EmptyState
              icon="chat-outline"
              title="Одоогоор чат үүсээгүй байна"
              description="Эмчийн дэлгэрэнгүй хэсгээс “Онлайн зөвлөгөө” эсвэл “Чат эхлүүлэх” товч дарж шинэ яриа нээнэ үү."
              action={{ label: "Дахин ачаалах", variant: "outline", onPress: () => void onReload() }}
            />
          </Card>
        ) : (
          <View className="gap-2">
            {myConversations.map((c) => (
              <Pressable key={c.id} onPress={() => router.push({ pathname: routes.customerChatDetail, params: { conversationId: c.id } })}>
                <Card>
                  <View className="flex-row items-center gap-3">
                    <AppImage
                      source={{
                        uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(c.provider.name)}&background=2563eb&color=ffffff&size=96`,
                      }}
                      fallbackIcon="hospital-building"
                      className="h-11 w-11 rounded-xl"
                    />
                    <View className="min-w-0 flex-1">
                      <View className="flex-row items-center justify-between">
                        <Text className="min-w-0 flex-1 text-sm font-semibold text-slate-900 dark:text-slate-50" numberOfLines={1}>
                          {c.provider.name}
                        </Text>
                        <Text className="ml-2 text-[11px] text-slate-500 dark:text-slate-400">
                          {new Date(c.updatedAtIso).toLocaleTimeString("mn-MN", { hour: "2-digit", minute: "2-digit" })}
                        </Text>
                      </View>
                      <Text className="mt-0.5 text-xs text-slate-500 dark:text-slate-400" numberOfLines={1}>
                        {c.providerTitle || "Эмнэлэг"}
                      </Text>
                      <View className="mt-1 flex-row items-center justify-between gap-2">
                        <Text className="min-w-0 flex-1 text-xs text-slate-500 dark:text-slate-400" numberOfLines={1}>
                          {c.messages[c.messages.length - 1]?.text || "Сүүлд ирсэн мессеж алга"}
                        </Text>
                        <Badge label={String(c.unreadForCustomer)} tone={c.unreadForCustomer > 0 ? "warning" : "neutral"} />
                      </View>
                    </View>
                  </View>
                </Card>
              </Pressable>
            ))}
          </View>
        )}
      </ScreenScrollView>
    </>
  );
}
