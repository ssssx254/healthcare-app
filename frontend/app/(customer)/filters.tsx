import { Button, Card, ScreenScrollView, SectionHeader } from "@/components";
import { router, Stack } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";

const cities = ["Улаанбаатар"];
const specialties = ["Дотоодын өвчин", "Хүүхдийн эмч", "Ерөнхий эмч"];

export default function FiltersScreen() {
  const [city, setCity] = useState<string | undefined>();
  const [specialty, setSpecialty] = useState<string | undefined>();

  return (
    <>
      <Stack.Screen options={{ title: "Шүүлтүүр" }} />
      <ScreenScrollView
        className="flex-1 bg-app-bg"
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
      >
        <SectionHeader title="Шүүлтүүр" subtitle="Хайлтад хэрэглэх нөхцөл сонгоно уу." />

        <Card className="mb-4">
          <Text className="text-sm font-semibold text-app-text">Хот</Text>
          <View className="mt-2 flex-row flex-wrap gap-2">
            {cities.map((c) => (
              <Button
                key={c}
                label={c}
                variant={city === c ? "primary" : "secondary"}
                className="min-w-[45%] flex-1"
                onPress={() => setCity((prev) => (prev === c ? undefined : c))}
              />
            ))}
          </View>
        </Card>

        <Card className="mb-4">
          <Text className="text-sm font-semibold text-app-text">Мэргэшил</Text>
          <View className="mt-2 flex-row flex-wrap gap-2">
            {specialties.map((s) => (
              <Button
                key={s}
                label={s}
                variant={specialty === s ? "primary" : "outline"}
                className="min-w-[45%] flex-1"
                onPress={() => setSpecialty((prev) => (prev === s ? undefined : s))}
              />
            ))}
          </View>
        </Card>

        <Button
          label="Хайлт руу хэрэглэх"
          onPress={() => {
            router.push({
              pathname: "/search",
              params: {
                q: "",
                ...(city ? { city } : {}),
                ...(specialty ? { specialty } : {}),
              },
            });
          }}
        />
        <Button label="Буцах" variant="ghost" className="mt-2" onPress={() => router.back()} />
      </ScreenScrollView>
    </>
  );
}
