import { Button, Card, FormScrollView, Input, SectionHeader } from "@/components";
import { Stack } from "expo-router";
import { useMemo, useState } from "react";
import { Text } from "react-native";

export default function ProviderChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saved, setSaved] = useState(false);
  const valid = useMemo(() => {
    if (!currentPassword.trim()) return false;
    if (newPassword.trim().length < 8) return false;
    if (newPassword !== confirmPassword) return false;
    return true;
  }, [confirmPassword, currentPassword, newPassword]);

  return (
    <>
      <Stack.Screen options={{ title: "Нууц үг солих" }} />
      <FormScrollView className="flex-1 bg-slate-50 dark:bg-slate-950" contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
        <SectionHeader title="Нууц үг солих" subtitle="Аюулгүй байдлын үүднээс шинэ нууц үг ашиглана уу." />
        <Card>
          <Input label="Одоогийн нууц үг" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />
          <Input label="Шинэ нууц үг" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
          <Input label="Шинэ нууц үг давтах" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
          {saved ? (
            <Text className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">Нууц үг амжилттай шинэчлэгдлээ (жишээ орчин).</Text>
          ) : null}
          <Button
            label="Хадгалах"
            className="mt-3"
            disabled={!valid}
            onPress={() => {
              setSaved(true);
              setCurrentPassword("");
              setNewPassword("");
              setConfirmPassword("");
            }}
          />
        </Card>
      </FormScrollView>
    </>
  );
}

