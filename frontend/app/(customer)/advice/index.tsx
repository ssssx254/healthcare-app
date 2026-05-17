import { AppImage, Card, Input, ScreenScrollView, SectionHeader } from "@/components";
import { adviceArticles, adviceCategories, type AdviceCategory } from "@/data/healthcare/adviceArticles";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Link, Stack } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

export default function AdviceListScreen() {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<AdviceCategory>("Бүгд");
  const [expanded, setExpanded] = useState(false);

  const shownCategories = expanded ? adviceCategories : adviceCategories.slice(0, 5);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return adviceArticles.filter((a) => {
      const categoryOk = selectedCategory === "Бүгд" || a.category === selectedCategory;
      if (!categoryOk) return false;
      if (!q) return true;
      return a.title.toLowerCase().includes(q) || a.excerpt.toLowerCase().includes(q) || a.author.toLowerCase().includes(q);
    });
  }, [query, selectedCategory]);

  return (
    <>
      <Stack.Screen options={{ title: "Зөвлөгөө" }} />
      <ScreenScrollView className="flex-1 bg-slate-50 dark:bg-slate-950" contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
        <SectionHeader title="Зөвлөгөө" subtitle="Эрүүл мэндийн зөвлөмж, мэдээлэл, нийтлэл." />

        <Card className="mb-4">
          <Input
            label="Нийтлэл хайх"
            value={query}
            onChangeText={setQuery}
            placeholder="Гарчиг, автор, агуулгаар хайх"
            autoCapitalize="none"
          />
        </Card>

        <Card className="mb-4">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-slate-900 dark:text-slate-50">Ангилал</Text>
            {adviceCategories.length > 5 ? (
              <Pressable onPress={() => setExpanded((s) => !s)}>
                <Text className="text-xs font-medium text-brand-700 dark:text-brand-300">{expanded ? "Хураах" : "Дэлгэрүүлэх"}</Text>
              </Pressable>
            ) : null}
          </View>
          <View className="flex-row flex-wrap gap-2">
            {shownCategories.map((c) => {
              const active = selectedCategory === c;
              return (
                <Pressable
                  key={c}
                  onPress={() => setSelectedCategory(c)}
                  className={`rounded-full border px-3 py-2 ${
                    active
                      ? "border-brand-600 bg-brand-50 dark:border-brand-400 dark:bg-brand-900"
                      : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                  }`}
                >
                  <Text className={`text-xs font-medium ${active ? "text-brand-700 dark:text-brand-300" : "text-slate-600 dark:text-slate-300"}`}>{c}</Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-sm font-semibold text-slate-900 dark:text-slate-50">Нийтлэлүүд</Text>
          <Text className="text-xs text-slate-500 dark:text-slate-400">{filtered.length} нийтлэл</Text>
        </View>

        <View className="gap-3">
          {filtered.map((article) => (
            <Link key={article.id} href={{ pathname: "/advice/[articleId]", params: { articleId: article.id } }} asChild>
              <Pressable className="active:opacity-95">
                <Card padded={false} className="overflow-hidden">
                  <AppImage
                    source={{ uri: article.imageUrl }}
                    fallbackIcon="book-open-page-variant-outline"
                    className="h-36 w-full"
                    resizeMode="cover"
                  />
                  <View className="p-4">
                    <Text className="text-base font-semibold text-slate-900 dark:text-slate-50">{article.title}</Text>
                    <Text className="mt-1 text-xs text-slate-500 dark:text-slate-400">{article.author} · {article.publishedAt}</Text>
                    <Text className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-300">{article.excerpt}</Text>
                    <View className="mt-3 flex-row items-center gap-3">
                      <View className="flex-row items-center">
                        <MaterialCommunityIcons name="eye-outline" size={14} color="#64748b" />
                        <Text className="ml-1 text-[11px] text-slate-500 dark:text-slate-400">{article.viewCount}</Text>
                      </View>
                      <View className="flex-row items-center">
                        <MaterialCommunityIcons name="thumb-up-outline" size={14} color="#64748b" />
                        <Text className="ml-1 text-[11px] text-slate-500 dark:text-slate-400">{article.likeCount}</Text>
                      </View>
                      <View className="flex-row items-center">
                        <MaterialCommunityIcons name="comment-text-outline" size={14} color="#64748b" />
                        <Text className="ml-1 text-[11px] text-slate-500 dark:text-slate-400">{article.commentCount}</Text>
                      </View>
                    </View>
                  </View>
                </Card>
              </Pressable>
            </Link>
          ))}
        </View>
      </ScreenScrollView>
    </>
  );
}

