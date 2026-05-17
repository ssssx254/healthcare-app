import { Button, Card, FormScrollView, Input, SectionHeader, useAppTheme } from "@/components";
import { useAuth } from "@/hooks/useAuth";
import type { ThemePreference } from "@/types";
import { router, Stack } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";

export default function ProfileEditScreen() {
  const { user, updateUserName } = useAuth();
  const { preference, setPreference } = useAppTheme();
  const [name, setName] = useState(user?.name ?? "");
  const [error, setError] = useState("");

  const setTheme = (value: ThemePreference) => {
    setPreference(value);
  };

  const onSave = () => {
    if (!name.trim()) {
      setError("Нэр оруулна уу.");
      return;
    }
    setError("");
    updateUserName(name.trim());
    router.back();
  };

  return (
    <>
      <Stack.Screen options={{ title: "Профайл засах" }} />
      <FormScrollView
        className="flex-1 bg-slate-50 dark:bg-slate-950"
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
      >
        <SectionHeader title="Профайл засах" subtitle="Хадгалахад зөвхөн төхөөрөмж дээр хадгална (жишээ)." />
        <Card>
          <Input label="Овог нэр" value={name} onChangeText={setName} placeholder="Таны нэр" error={error} />
          <Text className="text-xs text-slate-500 dark:text-slate-400">
            Имэйл: {user?.email} (одоогоор засварлахгүй)
          </Text>
        </Card>

        <Card className="mt-4">
          <Text className="text-sm font-semibold text-slate-800 dark:text-slate-100">Дэлгэцийн горим</Text>
          <Text className="mt-1 text-xs text-slate-500 dark:text-slate-400">Цайвар / харанхуй эсвэл системийн тохиргоо.</Text>
          <View className="mt-3 gap-2">
            <Button
              label="Системийн горим"
              variant={preference === "system" ? "secondary" : "outline"}
              onPress={() => setTheme("system")}
            />
            <Button
              label="Цайвар горим"
              variant={preference === "light" ? "secondary" : "outline"}
              onPress={() => setTheme("light")}
            />
            <Button
              label="Харанхуй горим"
              variant={preference === "dark" ? "secondary" : "outline"}
              onPress={() => setTheme("dark")}
            />
          </View>
        </Card>

        <Button label="Хадгалах" className="mt-4" onPress={onSave} />
        <Button label="Буцах" variant="ghost" className="mt-2" onPress={() => router.back()} />
      </FormScrollView>
    </>
  );
}
