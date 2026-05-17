import { Button, Card, EmptyState, ErrorState, LoadingState, ScreenScrollView } from "@/components";
import { useChatSync } from "@/hooks/useChatSync";
import { useAuth } from "@/hooks/useAuth";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from "react-native";

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

export default function ProviderChatDetailScreen() {
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const { conversationId } = useLocalSearchParams<{ conversationId?: string }>();
  const { conversations, refreshConversations, loadConversationMessages, sendConversationMessage, markConversationRead, retryMessage, loadingConversationId } = useChatSync();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const providerId = String(user?.id ?? "");
  const conversation = useMemo(
    () => conversations.find((c) => c.id === String(conversationId) && c.provider.id === providerId) ?? null,
    [conversations, conversationId, providerId],
  );
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
      .then(async () => {
        await markConversationRead(conversationId, "provider");
      })
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
    const body = text.trim();
    if (!body || !conversation) return;
    if (!isOnline) {
      setError("Интернетгүй тул зурвас илгээх боломжгүй");
      return;
    }
    setError(null);
    try {
      await sendConversationMessage({
        conversationId: conversation.id,
        senderRole: "provider",
        senderId: providerId,
        senderName: user?.name ?? "Үзүүлэгч",
        text: body,
      });
      await markConversationRead(conversation.id, "provider");
      setText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Хариу илгээх үед алдаа гарлаа.");
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: "Чатын дэлгэрэнгүй", headerTitle: "" }} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
      <ScreenScrollView className="flex-1 bg-slate-50 dark:bg-slate-950" contentContainerStyle={{ padding: 14, paddingBottom: 34 }}>
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
            <EmptyState icon="chat-remove-outline" title="Чат олдсонгүй" description="Энэ яриа байхгүй эсвэл танд хандах эрхгүй байна." />
            <Button label="Чатын жагсаалт руу буцах" variant="outline" className="mt-3" onPress={() => router.replace("/(provider)/chat")} />
          </Card>
        ) : (
          <>
            <Card className="mb-3">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-sm font-semibold text-slate-900 dark:text-slate-50">{conversation.customer.name}</Text>
                  <Text className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{conversation.providerTitle || "Эмнэлэг"}</Text>
                </View>
                <Text className="text-xs text-slate-500 dark:text-slate-400">
                  {isOnline ? "Онлайн (placeholder)" : "Оффлайн (placeholder)"}
                </Text>
              </View>
            </Card>

            {conversation.messages.length === 0 ? (
              <Card className="mb-3 overflow-hidden">
                <EmptyState icon="chat-processing-outline" title="Үйлчлүүлэгчийн зурвас хүлээж байна" description="Асуулт ирмэгц энд харуулна." />
              </Card>
            ) : (
              <View className="gap-2.5">
                {conversation.messages.map((m, idx) => {
                  const mine = m.senderRole === "provider";
                  const showDate = idx === 0 || dateKey(conversation.messages[idx - 1].sentAtIso) !== dateKey(m.sentAtIso);
                  return (
                    <View key={m.id} className="gap-1">
                      {showDate ? (
                        <View className="items-center py-1">
                          <Text className="rounded-full bg-slate-100 px-3 py-1 text-[11px] text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            {dateLabel(m.sentAtIso)}
                          </Text>
                        </View>
                      ) : null}
                    <View className={mine ? "items-end" : "items-start"}>
                      <View
                        className={`max-w-[86%] rounded-2xl px-3.5 py-2.5 ${
                          mine ? "bg-brand-600" : "border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                        }`}
                      >
                        <Text className={`text-sm leading-6 ${mine ? "text-white" : "text-slate-700 dark:text-slate-200"}`}>{m.text}</Text>
                      </View>
                      <Text className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                        {timeLabel(m.sentAtIso)}
                      </Text>
                      {mine && m.deliveryState === "sending" ? (
                        <Text className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Илгээж байна...</Text>
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
                  <Text className="ml-1 text-xs text-slate-500 dark:text-slate-400">Үйлчлүүлэгч бичиж байна…</Text>
                </View>
              ) : null}
              <View className="flex-row items-end gap-2">
                <TextInput
                  value={text}
                  onChangeText={setText}
                  placeholder="Хариу бичих…"
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  className="min-h-11 max-h-28 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm leading-5 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                />
                <Pressable
                  onPress={() => void onSend()}
                  disabled={!text.trim()}
                  className="h-11 w-11 items-center justify-center rounded-xl bg-brand-600 active:bg-brand-700 disabled:opacity-50"
                >
                  <MaterialCommunityIcons name="send" size={18} color="#ffffff" />
                </Pressable>
              </View>
              <Button label="Уншсан болгох" variant="outline" className="mt-3" onPress={() => conversation && void markConversationRead(conversation.id, "provider")} />
              <Button label="Жагсаалт руу буцах" variant="ghost" className="mt-2" onPress={() => router.back()} />
            </Card>
          </>
        )}
      </ScreenScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

