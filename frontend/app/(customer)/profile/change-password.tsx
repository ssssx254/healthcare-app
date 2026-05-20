import { Button, Card, FormScrollView, Input, SectionHeader } from "@/components";
import { Link } from "expo-router";
import { useMemo, useState } from "react";
import { Text } from "react-native";

export default function ChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = useMemo(() => {
    if (!currentPassword.trim() || !nextPassword.trim() || !confirmPassword.trim()) return false;
    if (nextPassword.length < 8) return false;
    if (nextPassword !== confirmPassword) return false;
    return true;
  }, [currentPassword, nextPassword, confirmPassword]);

  const onSave = () => {
    if (!canSave) {
      setError("Нууц үгийн мэдээллээ зөв бөглөнө үү.");
      return;
    }
    setError(null);
    setSaved(true);
  };

  return (
    <FormScrollView className="flex-1 bg-app-bg" contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
      <SectionHeader title="Нууц үг солих" subtitle="Нууц үгээ шинэчилж аюулгүй байдлаа нэмэгдүүлнэ үү." />
      <Card>
        <Input
          label="Одоогийн нууц үг"
          secureTextEntry
          value={currentPassword}
          onChangeText={(v) => {
            setSaved(false);
            setCurrentPassword(v);
          }}
          placeholder="••••••••"
        />
        <Input
          label="Шинэ нууц үг"
          secureTextEntry
          value={nextPassword}
          onChangeText={(v) => {
            setSaved(false);
            setNextPassword(v);
          }}
          placeholder="Хамгийн багадаа 8 тэмдэгт"
        />
        <Input
          label="Шинэ нууц үг давтах"
          secureTextEntry
          value={confirmPassword}
          onChangeText={(v) => {
            setSaved(false);
            setConfirmPassword(v);
          }}
          placeholder="••••••••"
        />
        {error ? <Text className="mb-2 text-sm text-red-600 dark:text-red-400">{error}</Text> : null}
        {saved ? <Text className="mb-2 text-sm text-emerald-600 dark:text-emerald-400">Нууц үг амжилттай шинэчлэгдлээ.</Text> : null}
        <Button label="Хадгалах" onPress={onSave} disabled={!canSave} />
      </Card>

      <Link href="/forgot-password" asChild>
        <Button label="Нууц үг мартсан уу?" variant="ghost" className="mt-3" />
      </Link>
    </FormScrollView>
  );
}

