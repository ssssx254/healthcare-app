import { Button, Card, FormScrollView, Input, SectionHeader } from "@/components";
import { useCustomerBooking } from "@/contexts/CustomerBookingContext";
import { fixtureDefaultHealthQuestionnaire } from "@/data/healthcare";
import { router, Stack } from "expo-router";
import { useState } from "react";
import { Text } from "react-native";

export default function HealthFormScreen() {
  const { draft, setDraftHealth } = useCustomerBooking();
  const [errors] = useState<Record<string, string>>({});

  const onContinue = () => {
    // Анкет нь optional: бөглөөгүй байсан ч захиалгын баталгаажуулалт руу үргэлжилнэ.
    if (!draft.symptoms.trim()) {
      setDraftHealth({ symptoms: "" });
    }
    router.push("/(customer)/booking/confirm");
  };

  return (
    <>
      <Stack.Screen options={{ title: "Эрүүл мэндийн анкет" }} />
      <FormScrollView
        className="flex-1 bg-slate-50 dark:bg-slate-950"
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
      >
        <SectionHeader
          title={fixtureDefaultHealthQuestionnaire.titleMn}
          subtitle={
            fixtureDefaultHealthQuestionnaire.descriptionMn ??
            "Үнэн зөв мэдээлэл өгөх нь зөвлөгөөний чанарт нөлөөлнө."
          }
        />

        <Card>
          <Input
            label="Одоогийн шинж тэмдэг"
            value={draft.symptoms}
            onChangeText={(t) => setDraftHealth({ symptoms: t })}
            placeholder="Жишээ: толгой өвдөж байна"
            multiline
            numberOfLines={4}
            error={errors.symptoms}
          />
          <Input
            label="Урьд нь оношлогдсон өвчин"
            value={draft.chronicIllness}
            onChangeText={(t) => setDraftHealth({ chronicIllness: t })}
            placeholder="Хоосон бол үлдээж болно"
            multiline
            numberOfLines={3}
          />
          <Input
            label="Уух эм, бэлдмэл"
            value={draft.medications}
            onChangeText={(t) => setDraftHealth({ medications: t })}
            placeholder="Эмийн нэр, тун"
            multiline
            numberOfLines={3}
          />
          <Input
            label="Харшил"
            value={draft.allergies}
            onChangeText={(t) => setDraftHealth({ allergies: t })}
            placeholder="Хоосон бол үлдээж болно"
            multiline
            numberOfLines={2}
          />
        </Card>

        <Text className="mt-3 text-xs text-slate-500 dark:text-slate-400">Анкет бөглөх нь сонголттой.</Text>

        <Button label="Үргэлжлүүлэх" className="mt-4" onPress={onContinue} />
        <Button label="Буцах" variant="ghost" className="mt-2" onPress={() => router.back()} />
      </FormScrollView>
    </>
  );
}
