import { AppImage, Button, Card, EmptyState, ErrorState, LoadingState, ScreenScrollView } from "@/components";
import { useChatSync } from "@/hooks/useChatSync";
import { useAuth } from "@/hooks/useAuth";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from "react-native";

function providerAvatar(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "Эмч")}&background=2563eb&color=ffffff&size=96`;
}

function dateKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function dateLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("mn-MN", { month: "long", day: "numeric", weekday: "short" });
}

function timeLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay
    ? d.toLocaleTimeString("mn-MN", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleString("mn-MN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function CustomerChatDetailScreen() {
  const { user } = useAuth();
  const { conversationId } = useLocalSearchParams<{ conversationId?: string }>();
  const { isOnline } = useNetworkStatus();
  const { conversations, refreshConversations, loadConversationMessages, sendConversationMessage, markConversationRead, retryMessage, loadingConversationId } = useChatSync();
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const conversation = useMemo(
    () => conversations.find((c) => c.id === String(conversationId) && c.customer.id === String(user?.id ?? "")),
    [conversationId, conversations, user?.id],
  );
  const messages = conversation?.messages ?? [];
  const isLoadingMessages = loadingConversationId === String(conversationId);

  useEffect(() => {
    if (!conversationId) {
      setLoading(false);
      setError("Чатын мэдээлэл олдсонгүй.");
      return;
    }
    let active = true;
    const slowTimer = setTimeout(() => {
      if (active) {
        setLoading(false);
        setError("Чат ачааллах удааширч байна. Дахин оролдоно уу.");
      }
    }, 10000);
    setLoading(true);
    setError(null);
    refreshConversations()
      .then(() => loadConversationMessages(conversationId))
      .then(() => markConversationRead(conversationId, "customer"))
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : "Чат ачаалахад алдаа гарлаа.");
      })
      .finally(() => {
        clearTimeout(slowTimer);
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      clearTimeout(slowTimer);
    };
  }, [conversationId, loadConversationMessages, markConversationRead, refreshConversations]);

  useEffect(() => {
    if (!conversationId) return;
    const interval = setInterval(() => {
      if (!isOnline) return;
      void loadConversationMessages(conversationId, { silent: true });
    }, 5000);
    return () => clearInterval(interval);
  }, [conversationId, isOnline]);

  const onSend = async () => {
    if (!conversation) return;
    const text = draft.trim();
    if (!text) return;
    if (!isOnline) {
      setError("Интернетгүй тул зурвас илгээх боломжгүй");
      return;
    }
    setError(null);
    try {
      await sendConversationMessage({
        conversationId: conversation.id,
        senderRole: "customer",
        senderId: conversation.customer.id,
        senderName: conversation.customer.name,
        text,
      });
      await markConversationRead(conversation.id, "customer");
      setDraft("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Зурвас илгээх үед алдаа гарлаа.");
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: "Чатын дэлгэрэнгүй" }} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
      <ScreenScrollView className="flex-1 bg-app-bg" contentContainerStyle={{ padding: 14, paddingBottom: 34 }}>
        {!isOnline ? (
          <Card className="mb-3 border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20">
            <Text className="text-xs text-amber-700 dark:text-amber-300">Интернетгүй тул зурвас илгээх боломжгүй</Text>
          </Card>
        ) : null}
        {error ? <ErrorState title="Чатын алдаа" message={error} /> : null}
        {loading ? (
          <Card>
            <LoadingState compact title="Чат ачаалж байна…" subtitle="Түр хүлээнэ үү." />
          </Card>
        ) : !conversation ? (
          <Card className="overflow-hidden">
            <EmptyState
              icon="chat-remove-outline"
              title="Чат олдсонгүй"
              description="Энэ яриа байхгүй эсвэл танд хандах эрхгүй байна."
            />
            <Button label="Чатын жагсаалт руу буцах" variant="outline" className="mt-3" onPress={() => router.replace("/(customer)/chat")} />
          </Card>
        ) : (
          <>
            <Card className="mb-3">
              <View className="flex-row items-center gap-3">
                <AppImage
                  source={{ uri: providerAvatar(conversation.provider.name) }}
                  fallbackIcon="hospital-building"
                  className="h-12 w-12 rounded-xl"
                />
                <View className="min-w-0 flex-1">
                  <Text className="text-sm font-semibold text-app-text" numberOfLines={1}>
                    {conversation.provider.name}
                  </Text>
                  <Text className="mt-0.5 text-xs text-app-text-muted" numberOfLines={1}>
                    {conversation.providerTitle || "Эмнэлэг"}
                  </Text>
                </View>
                <Text className="text-xs text-app-text-muted">
                  {conversation.providerPresence === "online" && isOnline ? "Онлайн" : "Оффлайн (placeholder)"}
                </Text>
              </View>
            </Card>

            {messages.length === 0 ? (
              <Card className="mb-3 overflow-hidden">
                <EmptyState
                  icon="chat-processing-outline"
                  title="Эхлүүлэх зурвас хүлээж байна"
                  description="Шинж тэмдгээ товч бичээд илгээвэл эмч хариу өгнө."
                />
              </Card>
            ) : (
              <View className="gap-2.5">
                {messages.map((m, idx) => {
                  const mine = m.senderRole === "customer";
                  const showDate = idx === 0 || dateKey(messages[idx - 1].sentAtIso) !== dateKey(m.sentAtIso);
                  return (
                    <View key={m.id} className="gap-1">
                      {showDate ? (
                        <View className="items-center py-1">
                          <Text className="rounded-full px-3 py-1 text-[11px] text-slate-500 bg-app-muted text-app-text-muted">
                            {dateLabel(m.sentAtIso)}
                          </Text>
                        </View>
                      ) : null}
                    <View className={mine ? "items-end" : "items-start"}>
                      <View
                        className={`max-w-[86%] rounded-2xl px-3.5 py-2.5 ${
                          mine ? "bg-brand-600" : "border-app-border bg-app-card"
                        }`}
                      >
                        <Text className={`text-sm leading-6 ${mine ? "text-white" : "text-app-text-secondary"}`}>{m.text}</Text>
                      </View>
                      <Text className="mt-1 text-[11px] text-app-text-muted">
                        {timeLabel(m.sentAtIso)}
                      </Text>
                      {mine && m.deliveryState === "sending" ? (
                        <Text className="mt-0.5 text-[11px] text-app-text-muted">Илгээж байна...</Text>
                      ) : null}
                      {mine && m.deliveryState === "failed" ? (
                        <Pressable onPress={() => void retryMessage(conversation.id, m.id)}>
                          <Text className="mt-0.5 text-[11px] text-rose-600 dark:text-rose-300">Илгээлт амжилтгүй. Дахин оролдох</Text>
                        </Pressable>
                      ) : null}
                    </View>
                    </View>
                  );
                })}
              </View>
            )}

            <Card className="mt-4">
              {isLoadingMessages ? (
                <View className="mb-2 flex-row items-center gap-1.5">
                  <View className="h-2 w-2 rounded-full bg-slate-400" />
                  <View className="h-2 w-2 rounded-full bg-slate-400" />
                  <View className="h-2 w-2 rounded-full bg-slate-400" />
                  <Text className="ml-1 text-xs text-app-text-muted">Эмч бичиж байна…</Text>
                </View>
              ) : null}
              <View className="flex-row items-end gap-2">
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  placeholder="Зурвас бичих…"
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  className="min-h-11 max-h-28 flex-1 rounded-xl px-3 py-2.5 text-sm leading-5 text-slate-900 border-app-border bg-app-card dark:text-slate-50"
                />
                <Pressable
                  onPress={() => void onSend()}
                  disabled={!draft.trim()}
                  className="h-11 w-11 items-center justify-center rounded-xl bg-brand-600 active:bg-brand-700 disabled:opacity-50"
                >
                  <MaterialCommunityIcons name="send" size={18} color="#ffffff" />
                </Pressable>
              </View>
              <Button label="Жагсаалт руу буцах" variant="outline" className="mt-3" onPress={() => router.back()} />
            </Card>
          </>
        )}
      </ScreenScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

