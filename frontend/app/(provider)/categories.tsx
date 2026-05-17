import { Button, Card, FormScrollView, Input, SectionHeader } from "@/components";
import { useProviderWorkspace } from "@/contexts/ProviderWorkspaceContext";
import { Stack } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";

export default function CategoriesScreen() {
  const { categories, addCategory, removeCategory } = useProviderWorkspace();
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const onAdd = () => {
    if (!name.trim()) {
      setError("Ангиллын нэр оруулна уу.");
      return;
    }
    if (categories.some((c) => c.name.trim().toLowerCase() === name.trim().toLowerCase())) {
      setError("Ижил нэртэй ангилал аль хэдийн байна.");
      return;
    }
    setError("");
    addCategory(name.trim());
    setName("");
  };

  return (
    <>
      <Stack.Screen options={{ title: "Ангилал удирдах" }} />
      <FormScrollView
        className="flex-1 bg-slate-50 dark:bg-slate-950"
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
      >
        <SectionHeader title="Ангилал удирдах" subtitle="Үйлчилгээг ангилж бүлэглэнэ." />
        <Card className="mb-4">
          <Input label="Шинэ ангилал" value={name} onChangeText={setName} placeholder="Жишээ: оношлогоо" error={error} />
          <Button label="Нэмэх" className="mt-3" onPress={onAdd} />
        </Card>
        {categories.length === 0 ? (
          <Card>
            <Text className="text-sm text-slate-600 dark:text-slate-300">Одоогоор ангилал алга байна. Эхний ангиллаа нэмнэ үү.</Text>
          </Card>
        ) : (
          <View className="gap-2">
            {categories.map((c) => (
              <Card key={c.id}>
                <View className="gap-3">
                  <View className="min-w-0">
                    <Text className="text-xs text-slate-500 dark:text-slate-400">Ангиллын нэр</Text>
                    <Text className="mt-1 font-medium text-slate-900 dark:text-slate-50">
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
