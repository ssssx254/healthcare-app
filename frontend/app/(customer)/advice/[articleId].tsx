import { AdviceArticleDetail, adviceArticleScreenTitle } from "@/components/AdviceArticleDetail";
import { ScreenScrollView } from "@/components";
import { Stack, useLocalSearchParams } from "expo-router";

export default function AdviceDetailScreen() {
  const { articleId } = useLocalSearchParams<{ articleId?: string | string[] }>();

  return (
    <>
      <Stack.Screen options={{ title: adviceArticleScreenTitle(articleId) }} />
      <ScreenScrollView className="flex-1 bg-app-bg" contentContainerStyle={{ paddingBottom: 0 }}>
        <AdviceArticleDetail articleId={articleId} />
      </ScreenScrollView>
    </>
  );
}
