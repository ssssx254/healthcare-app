import { Button, Card, FormScrollView, Input, SectionHeader } from "@/components";
import { useProviderWorkspace } from "@/contexts/ProviderWorkspaceContext";
import { Stack } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";

export default function CategoriesScreen() {
  const { categories, addCategory, removeCategory } = useProviderWorkspace();
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const [saving, setSaving] = useState(false);

  const onAdd = async () => {
    if (!name.trim()) {
      setError("Ангиллын нэр оруулна уу.");
      return;
    }
    if (categories.some((c) => c.name.trim().toLowerCase() === name.trim().toLowerCase())) {
      setError("Ижил нэртэй ангилал аль хэдийн байна.");
      return;
    }
    setError("");
    try {
      setSaving(true);
      await addCategory(name.trim());
      setName("");
    } catch {
      setError("Ангилал хадгалахад алдаа гарлаа. Дахин оролдоно уу.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: "Ангилал удирдах" }} />
      <FormScrollView
        className="flex-1 bg-app-bg"
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
      >
        <SectionHeader title="Ангилал удирдах" subtitle="Үйлчилгээг ангилж бүлэглэнэ." />
        <Card className="mb-4">
          <Input label="Шинэ ангилал" value={name} onChangeText={setName} placeholder="Жишээ: оношлогоо" error={error} />
          <Button label="Нэмэх" className="mt-3" loading={saving} onPress={() => void onAdd()} />
        </Card>
        {categories.length === 0 ? (
          <Card>
            <Text className="text-sm text-app-text-secondary">Одоогоор ангилал алга байна. Эхний ангиллаа нэмнэ үү.</Text>
          </Card>
        ) : (
          <View className="gap-2">
            {categories.map((c, index) => (
              <Card key={`${c.id}-${index}`}>
                <View className="gap-3">
                  <View className="min-w-0">
                    <Text className="text-xs text-app-text-muted">Ангиллын нэр</Text>
                    <Text className="mt-1 font-medium text-app-text">
                      {c.name?.trim() || "Нэргүй ангилал"}
                    </Text>
                  </View>
                  <Button label="Устгах" variant="secondary" onPress={() => removeCategory(c.id)} />
                </View>
              </Card>
            ))}
          </View>
        )}
      </FormScrollView>
    </>
  );
}
