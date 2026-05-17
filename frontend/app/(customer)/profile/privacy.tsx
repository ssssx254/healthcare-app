import { Card, ScreenScrollView, SectionHeader } from "@/components";
import { Stack } from "expo-router";
import { Text, View } from "react-native";

export default function PrivacyScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Нууцлалын бодлого" }} />
      <ScreenScrollView className="flex-1 bg-slate-50 dark:bg-slate-950" contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
        <SectionHeader title="Нууцлалын бодлого" subtitle="Таны мэдээллийг хэрхэн хамгаалах тухай." />
        <Card>
          <View className="gap-3">
            <Text className="text-sm leading-6 text-slate-700 dark:text-slate-300">
              • Хувийн мэдээллийг зөвшөөрөлгүй гуравдагч этгээдэд дамжуулахгүй.
            </Text>
            <Text className="text-sm leading-6 text-slate-700 dark:text-slate-300">
              • Эмнэлгийн мэдээллийг хамгаалалттай орчинд хадгална.
            </Text>
            <Text className="text-sm leading-6 text-slate-700 dark:text-slate-300">
              • Та хүссэн үедээ мэдээллээ засах, устгах хүсэлт гаргаж болно.
            </Text>
          </View>
        </Card>
      </ScreenScrollView>
    </>
  );
}

