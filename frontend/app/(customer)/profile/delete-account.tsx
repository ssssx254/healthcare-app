import { Button, Card, FormScrollView, Input, SectionHeader } from "@/components";
import { routes } from "@/constants/appRoutes";
import { useAuth } from "@/hooks/useAuth";
import { router, Stack } from "expo-router";
import { useMemo, useState } from "react";
import { Text } from "react-native";

export default function DeleteAccountScreen() {
  const { signOut } = useAuth();
  const [confirmText, setConfirmText] = useState("");
  const [done, setDone] = useState(false);
  const canDelete = useMemo(() => confirmText.trim() === "УСТГАХ", [confirmText]);

  return (
    <>
      <Stack.Screen options={{ title: "Бүртгэл устгах" }} />
      <FormScrollView className="flex-1 bg-app-bg" contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
        <SectionHeader title="Бүртгэл устгах" subtitle="Анхааруулга: Энэ үйлдлийг буцаах боломжгүй." />
        <Card>
          <Text className="text-sm leading-6 text-app-text-secondary">
            Бүртгэлээ устгах бол доорх талбарт <Text className="font-semibold">УСТГАХ</Text> гэж бичнэ үү.
          </Text>
          <Input
            label="Баталгаажуулах үг"
            value={confirmText}
            onChangeText={(v) => {
              setDone(false);
              setConfirmText(v);
            }}
            placeholder="УСТГАХ"
          />
          {done ? <Text className="mb-2 text-sm text-emerald-600 dark:text-emerald-400">Бүртгэл устгах хүсэлт хүлээн авлаа (жишээ).</Text> : null}
          <Button
            label="Бүртгэл устгах"
            variant="secondary"
            disabled={!canDelete}
            onPress={() => {
              setDone(true);
              signOut();
              router.replace(routes.login);
            }}
          />
          <Button label="Буцах" variant="ghost" className="mt-2" onPress={() => router.back()} />
        </Card>
      </FormScrollView>
    </>
  );
}

