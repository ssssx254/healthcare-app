import { Card, ScreenScrollView, SectionHeader } from "@/components";
import { Stack } from "expo-router";
import { Text, View } from "react-native";

export default function TermsScreen() {
  const items = [
    "Үйлчилгээний мэдээллийг зөвхөн эрүүл мэндийн зорилгоор ашиглана.",
    "Хэрэглэгч оруулсан мэдээллийн үнэн зөвийг хариуцна.",
    "Онлайн зөвлөгөө нь анхан шатны мэдээллийн зорилготой.",
    "Яаралтай тохиолдолд шууд эмнэлэгт хандана.",
  ];

  return (
    <>
      <Stack.Screen options={{ title: "Үйлчилгээний нөхцөл" }} />
      <ScreenScrollView className="flex-1 bg-slate-50 dark:bg-slate-950" contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
        <SectionHeader title="Үйлчилгээний нөхцөл" subtitle="Апп ашиглах үндсэн нөхцөлүүд." />
        <Card>
          <View className="gap-3">
            {items.map((it) => (
              <Text key={it} className="text-sm leading-6 text-slate-700 dark:text-slate-300">
                • {it}
              </Text>
            ))}
          </View>
        </Card>
      </ScreenScrollView>
    </>
  );
}

