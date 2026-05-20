import { Button, Card, FormScrollView, Input, SectionHeader } from "@/components";
import { useAuth } from "@/hooks/useAuth";
import { router, Stack } from "expo-router";
import { useState } from "react";
import { Text } from "react-native";

export default function ProfileEditScreen() {
  const { user, updateUserName } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [error, setError] = useState("");

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
        className="flex-1 bg-app-bg"
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
      >
        <SectionHeader title="Профайл засах" subtitle="Хадгалахад зөвхөн төхөөрөмж дээр хадгална (жишээ)." />
        <Card>
          <Input label="Овог нэр" value={name} onChangeText={setName} placeholder="Таны нэр" error={error} />
          <Text className="text-xs text-app-text-muted">
            Имэйл: {user?.email} (одоогоор засварлахгүй)
          </Text>
        </Card>

        <Button label="Хадгалах" className="mt-4" onPress={onSave} />
        <Button label="Буцах" variant="ghost" className="mt-2" onPress={() => router.back()} />
      </FormScrollView>
    </>
  );
}
