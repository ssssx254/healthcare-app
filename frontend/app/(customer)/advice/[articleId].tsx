import { AppImage, Button, Card, Input, ScreenScrollView } from "@/components";
import { adviceArticles } from "@/data/healthcare/adviceArticles";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Share, Text, View, Pressable } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";

export default function AdviceDetailScreen() {
  const { articleId } = useLocalSearchParams<{ articleId: string }>();
  const article = useMemo(() => adviceArticles.find((a) => a.id === articleId), [articleId]);
  const [liked, setLiked] = useState(false);
  const [comment, setComment] = useState("");
  const [localLikes, setLocalLikes] = useState(article?.likeCount ?? 0);
  const [localComments, setLocalComments] = useState(article?.commentCount ?? 0);
  const [submittedComments, setSubmittedComments] = useState<string[]>([]);

  if (!article) {
    return (
      <>
        <Stack.Screen options={{ title: "Нийтлэл" }} />
        <ScreenScrollView className="flex-1 bg-app-bg" contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
          <Card>
            <Text className="text-sm text-app-text-secondary">Нийтлэл олдсонгүй.</Text>
          </Card>
        </ScreenScrollView>
      </>
    );
  }

  const onToggleLike = () => {
    setLiked((prev) => {
      const next = !prev;
      setLocalLikes((n) => (next ? n + 1 : Math.max(0, n - 1)));
      return next;
    });
  };

  const onCommentSubmit = () => {
    const next = comment.trim();
    if (!next) return;
    setSubmittedComments((list) => [next, ...list]);
    setLocalComments((n) => n + 1);
    setComment("");
  };

  const onShare = async () => {
    await Share.share({
      message: `${article.title}\n\n${article.excerpt}`,
    });
  };

  return (
    <>
      <Stack.Screen options={{ title: "Зөвлөгөөний нийтлэл" }} />
      <ScreenScrollView className="flex-1 bg-app-bg" contentContainerStyle={{ paddingBottom: 28 }}>
        <AppImage
          source={{ uri: article.imageUrl }}
          fallbackIcon="book-open-page-variant-outline"
          className="h-56 w-full"
          resizeMode="cover"
        />

        <View className="px-4 pt-4">
          <Text className="text-xl font-bold leading-8 text-app-text">{article.title}</Text>
          <Text className="mt-2 text-xs text-app-text-muted">{article.author} · {article.publishedAt}</Text>

          <View className="mt-3 flex-row items-center gap-4">
            <View className="flex-row items-center">
              <MaterialCommunityIcons name="eye-outline" size={16} color="#64748b" />
              <Text className="ml-1 text-xs text-app-text-muted">{article.viewCount}</Text>
            </View>
            <View className="flex-row items-center">
              <MaterialCommunityIcons name="thumb-up-outline" size={16} color="#64748b" />
              <Text className="ml-1 text-xs text-app-text-muted">{localLikes}</Text>
            </View>
            <View className="flex-row items-center">
              <MaterialCommunityIcons name="comment-text-outline" size={16} color="#64748b" />
              <Text className="ml-1 text-xs text-app-text-muted">{localComments}</Text>
            </View>
          </View>

          <Card className="mt-4">
            <Text className="text-sm leading-6 text-app-text-secondary">{article.content}</Text>
          </Card>

          <Card className="mt-4">
            <Text className="text-sm font-semibold text-app-text">Үйлдэл</Text>
            <View className="mt-3 flex-row gap-2">
              <Pressable
                onPress={onToggleLike}
                className={`flex-1 flex-row items-center justify-center rounded-xl border px-3 py-2.5 ${
                  liked ? "border-brand-600 bg-brand-50 dark:border-brand-400 dark:bg-brand-900" : "border-slate-200 bg-white border-app-border bg-app-card"
                }`}
              >
                <MaterialCommunityIcons name={liked ? "thumb-up" : "thumb-up-outline"} size={16} color={liked ? "#2563eb" : "#64748b"} />
                <Text className={`ml-2 text-xs font-medium ${liked ? "text-brand-700 dark:text-brand-300" : "text-app-text-secondary"}`}>
                  Таалагдлаа
                </Text>
              </Pressable>
              <Pressable
                onPress={onShare}
                className="flex-1 flex-row items-center justify-center rounded-xl px-3 py-2.5 border-app-border bg-app-card"
              >
                <MaterialCommunityIcons name="share-variant-outline" size={16} color="#64748b" />
                <Text className="ml-2 text-xs font-medium text-app-text-secondary">Хуваалцах</Text>
              </Pressable>
            </View>
          </Card>

          <Card className="mt-4">
            <Text className="text-sm font-semibold text-app-text">Сэтгэгдэл</Text>
            <Input
              label="Сэтгэгдэл бичих"
              value={comment}
              onChangeText={setComment}
              placeholder="Өөрийн бодлоо үлдээнэ үү…"
              multiline
              numberOfLines={3}
            />
            <Button label="Сэтгэгдэл илгээх" className="mt-2" onPress={onCommentSubmit} />

            <View className="mt-4 gap-2">
              {submittedComments.length === 0 ? (
                <Text className="text-xs text-app-text-muted">Одоогоор шинэ сэтгэгдэл байхгүй байна.</Text>
              ) : (
                submittedComments.map((c, idx) => (
                  <View key={`${idx}-${c.slice(0, 12)}`} className="rounded-xl border px-3 py-2.5 border-app-border bg-app-muted">
                    <Text className="text-xs leading-5 text-app-text-secondary">{c}</Text>
                  </View>
                ))
              )}
            </View>
          </Card>
        </View>
      </ScreenScrollView>
    </>
  );
}

