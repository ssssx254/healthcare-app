import { LoadingState } from "@/components";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";

/** Хуучин холбоос — эмчийн дэлгэрэнгүй рүү шилжүүлнэ. */
export default function DoctorReviewsRedirectScreen() {
  const { clinicId, doctorId } = useLocalSearchParams<{ clinicId: string; doctorId: string }>();

  useEffect(() => {
    if (clinicId && doctorId) {
      router.replace(`/clinic/${clinicId}/doctor/${doctorId}`);
    }
  }, [clinicId, doctorId]);

  return (
    <>
      <Stack.Screen options={{ title: "Сэтгэгдэл" }} />
      <View className="flex-1 bg-app-bg p-4">
        <LoadingState compact title="Эмчийн хуудас руу шилжиж байна…" />
      </View>
    </>
  );
}
