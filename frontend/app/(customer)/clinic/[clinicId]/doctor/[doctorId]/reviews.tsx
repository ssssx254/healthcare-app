import { Card, ScreenScrollView, SectionHeader } from "@/components";
import { Stack, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

export default function DoctorReviewsScreen() {
  const { doctorId } = useLocalSearchParams<{ doctorId: string }>();

  const allReviews = [
    { id: "rv-1", name: "О. Мөнхжин", rating: 5, text: "Эмчилгээний төлөвлөгөө тодорхой, ойлгомжтой байсан.", date: "2026-04-12" },
    { id: "rv-2", name: "Н. Төгөлдөр", rating: 4, text: "Зөвлөгөө маш хэрэгтэй, дахин үзүүлнэ.", date: "2026-04-08" },
    { id: "rv-3", name: "С. Одончимэг", rating: 5, text: "Харьцаа сайтай, шинжилгээний тайлбар сайн өгсөн.", date: "2026-04-04" },
    { id: "rv-4", name: "Э. Батмөнх", rating: 4, text: "Цаг товлолт хурдан, эмч анхааралтай сонссон.", date: "2026-03-28" },
    { id: "rv-5", name: "Х. Энхмаа", rating: 5, text: "Дараагийн хяналтын алхмыг маш ойлгомжтой тайлбарласан.", date: "2026-03-21" },
  ];

  return (
    <>
      <Stack.Screen options={{ title: "Бүх сэтгэгдэл" }} />
      <ScreenScrollView className="flex-1 bg-slate-50 dark:bg-slate-950" contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
        <SectionHeader
          title="Бүх сэтгэгдэл"
          subtitle={doctorId ? `Эмч #${doctorId} · Үйлчлүүлэгчдийн үнэлгээ` : "Үйлчлүүлэгчдийн үнэлгээ"}
        />
        <View className="gap-3">
          {allReviews.map((r) => (
            <Card key={r.id}>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-semibold text-slate-900 dark:text-slate-50">{r.name}</Text>
                <Text className="text-xs text-amber-600 dark:text-amber-300">★ {r.rating.toFixed(1)}</Text>
              </View>
              <Text className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{r.text}</Text>
              <Text className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">{r.date}</Text>
            </Card>
          ))}
        </View>
      </ScreenScrollView>
    </>
  );
}
