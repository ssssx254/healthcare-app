import { Button, Card, FormScrollView, Input, ProviderFormSection, SectionHeader } from "@/components";
import { useProviderWorkspace } from "@/contexts/ProviderWorkspaceContext";
import {
  validateAddressMn,
  validateCityMn,
  validateClinicNameMn,
  validateDescriptionMn,
  validatePhoneMn,
} from "@/lib/providerFormValidators";
import { router, Stack } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";

const DESC_MAX = 2000;

export default function ClinicEditScreen() {
  const { clinic, saveClinicToApi } = useProviderWorkspace();
  const [name, setName] = useState(clinic.name);
  const [city, setCity] = useState(clinic.city);
  const [address, setAddress] = useState(clinic.address);
  const [phone, setPhone] = useState(clinic.phone);
  const [description, setDescription] = useState(clinic.description);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [savedOk, setSavedOk] = useState(false);

  const onSave = () => {
    const e: Record<string, string> = {};
    const n = validateClinicNameMn(name);
    if (n) e.name = n;
    const c = validateCityMn(city);
    if (c) e.city = c;
    const a = validateAddressMn(address);
    if (a) e.address = a;
    const p = validatePhoneMn(phone);
    if (p) e.phone = p;
    const d = validateDescriptionMn(description, DESC_MAX);
    if (d) e.description = d;
    setErrors(e);
    setSavedOk(false);
    if (Object.keys(e).length > 0) {
      setFormError("Талбаруудыг шалгаад дахин оролдоно уу.");
      return;
    }
    setFormError(null);
    setLoading(true);
    void (async () => {
      try {
        await saveClinicToApi({
          name: name.trim(),
          city: city.trim(),
          address: address.trim(),
          phone: phone.trim(),
          description: description.trim(),
        });
        setSavedOk(true);
        setTimeout(() => router.back(), 600);
      } catch (err) {
        setFormError(err instanceof Error ? err.message : "Хадгалахад алдаа гарлаа.");
      } finally {
        setLoading(false);
      }
    })();
  };

  return (
    <>
      <Stack.Screen options={{ title: "Эмнэлгийн мэдээлэл засах" }} />
      <FormScrollView
        className="flex-1 bg-app-bg"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      >
        <SectionHeader
          title="Эмнэлгийн мэдээлэл засах"
          subtitle="Өөрчлөлт үйлчлүүлэгчийн апп дээрх эмнэлгийн жагсаалт, дэлгэрэнгүйд шууд тусгагдана."
        />

        {savedOk ? (
          <View className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-950/50">
            <Text className="text-sm font-medium text-emerald-900 dark:text-emerald-100">Амжилттай хадгалагдлаа.</Text>
          </View>
        ) : null}

        <Card className="mb-4">
          <ProviderFormSection title="Үндсэн мэдээлэл" description="Нэр, утас, байршлын гарчиг.">
            <Input
              label="Эмнэлгийн албан нэр"
              value={name}
              onChangeText={setName}
              maxLength={191}
              error={errors.name}
              hint="Үйлчлүүлэгчид харагдах нэр."
            />
            <Input
              label="Утасны дугаар"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              error={errors.phone}
              hint="8–15 оронтой."
            />
            <Input label="Хот / дүүрэг / аймаг" value={city} onChangeText={setCity} maxLength={128} error={errors.city} />
          </ProviderFormSection>
        </Card>

        <Card className="mb-4">
          <ProviderFormSection title="Хаяг ба танилцуулга" description="Ойлгомжтой хаяг итгэл үүсгэнэ.">
            <Input
              label="Дэлгэрэнгүй хаяг"
              value={address}
              onChangeText={setAddress}
              multiline
              maxLength={500}
              error={errors.address}
              hint="5–500 тэмдэгт."
            />
            <Input
              label="Товч танилцуулга"
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={DESC_MAX}
              error={errors.description}
              hint={`Сонголттой. ${description.length} / ${DESC_MAX}`}
            />
          </ProviderFormSection>
        </Card>

        {formError ? (
          <View className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/50 dark:bg-red-950/40">
            <Text className="text-sm text-red-800 dark:text-red-200">{formError}</Text>
          </View>
        ) : null}

        <Button label="Хадгалах" loading={loading} onPress={onSave} />
        <Button label="Буцах" variant="ghost" className="mt-2" disabled={loading} onPress={() => router.back()} />
      </FormScrollView>
    </>
  );
}
