import { Button, Card, FormScrollView, Input, SectionHeader } from "@/components";
import { useAuth } from "@/hooks/useAuth";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import type { ComponentProps } from "react";
import { useMemo, useState } from "react";
import { Text, View } from "react-native";

type PersonalForm = {
  fullName: string;
  phone: string;
  register: string;
  bloodType: string;
  heightCm: string;
  weightKg: string;
  smoking: string;
  alcohol: string;
  allergies: string;
  chronic: string;
  education: string;
  address: string;
};

export default function PersonalInfoScreen() {
  const { user, updateUserName } = useAuth();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<PersonalForm>({
    fullName: user?.name ?? "",
    phone: user?.phone ?? "",
    register: "",
    bloodType: "",
    heightCm: "",
    weightKg: "",
    smoking: "",
    alcohol: "",
    allergies: "",
    chronic: "",
    education: "",
    address: "",
  });
  const [error, setError] = useState<string | null>(null);

  const isValid = useMemo(() => form.fullName.trim().length >= 2, [form.fullName]);
  const hasChanges = useMemo(() => form.fullName.trim() !== (user?.name ?? "").trim(), [form.fullName, user?.name]);
  const canSave = isValid && hasChanges;

  const setField = (key: keyof PersonalForm, value: string) => {
    setSaved(false);
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSave = () => {
    if (!isValid) {
      setError("Овог нэр хамгийн багадаа 2 тэмдэгт байна.");
      return;
    }
    setError(null);
    updateUserName(form.fullName.trim());
    setSaved(true);
  };

  const sectionTitle = (icon: ComponentProps<typeof MaterialCommunityIcons>["name"], title: string) => (
    <View className="mb-2 mt-1 flex-row items-center gap-2">
      <MaterialCommunityIcons name={icon} size={18} color="#2563eb" />
      <Text className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</Text>
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ title: "Хувийн мэдээлэл" }} />
      <FormScrollView className="flex-1 bg-slate-50 dark:bg-slate-950" contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
        <SectionHeader title="Хувийн мэдээлэл" subtitle="Өөрийн мэдээллээ шинэчилж хадгална уу." />

        <Card className="mb-4">
          {sectionTitle("account-details-outline", "Үндсэн мэдээлэл")}
          <Input label="Овог нэр" value={form.fullName} onChangeText={(v) => setField("fullName", v)} placeholder="Жишээ: Батбаатар" />
          <Input label="Утас" value={form.phone} onChangeText={(v) => setField("phone", v)} placeholder="99112233" keyboardType="phone-pad" />
          <Input label="Регистрийн дугаар" value={form.register} onChangeText={(v) => setField("register", v)} placeholder="АА00112233" />
        </Card>

        <Card className="mb-4">
          {sectionTitle("heart-pulse", "Эрүүл мэндийн мэдээлэл")}
          <Input label="Цусны бүлэг" value={form.bloodType} onChangeText={(v) => setField("bloodType", v)} placeholder="A+, О−, гэх мэт" />
          <View className="flex-row gap-2">
            <Input
              label="Өндөр (см)"
              value={form.heightCm}
              onChangeText={(v) => setField("heightCm", v.replace(/[^\d]/g, ""))}
              placeholder="170"
              keyboardType="number-pad"
              className="flex-1"
            />
            <Input
              label="Жин (кг)"
              value={form.weightKg}
              onChangeText={(v) => setField("weightKg", v.replace(/[^\d]/g, ""))}
              placeholder="65"
              keyboardType="number-pad"
              className="flex-1"
            />
          </View>
          <Input
            label="Архаг өвчин"
            value={form.chronic}
            onChangeText={(v) => setField("chronic", v)}
            placeholder="Жишээ: Чихрийн шижин"
            multiline
            numberOfLines={2}
          />
        </Card>

        <Card className="mb-4">
          {sectionTitle("alert-circle-outline", "Хорт зуршил")}
          <Input label="Тамхи" value={form.smoking} onChangeText={(v) => setField("smoking", v)} placeholder="Үгүй / өдөрт ... ширхэг" />
          <Input label="Архи" value={form.alcohol} onChangeText={(v) => setField("alcohol", v)} placeholder="Үгүй / хааяа / тогтмол" />
        </Card>

        <Card className="mb-4">
          {sectionTitle("allergy", "Харшил")}
          <Input
            label="Харшлын мэдээлэл"
            value={form.allergies}
            onChangeText={(v) => setField("allergies", v)}
            placeholder="Эмийн болон хүнсний харшил"
            multiline
            numberOfLines={2}
          />
        </Card>

        <Card className="mb-4">
          {sectionTitle("school-outline", "Боловсрол")}
          <Input
            label="Боловсролын мэдээлэл"
            value={form.education}
            onChangeText={(v) => setField("education", v)}
            placeholder="Сургууль, мэргэжил"
          />
        </Card>

        <Card className="mb-4">
          {sectionTitle("map-marker-outline", "Оршин суугаа хаяг")}
          <Input
            label="Хаяг"
            value={form.address}
            onChangeText={(v) => setField("address", v)}
            placeholder="Дүүрэг, хороо, гудамж, байр"
            multiline
            numberOfLines={2}
          />
        </Card>

        {error ? <Text className="mb-2 text-sm text-red-600 dark:text-red-400">{error}</Text> : null}
        {saved ? <Text className="mb-2 text-sm text-emerald-600 dark:text-emerald-400">Мэдээлэл амжилттай хадгалагдлаа.</Text> : null}

        <Button label="Хадгалах" onPress={onSave} disabled={!canSave} />
      </FormScrollView>
    </>
  );
}

