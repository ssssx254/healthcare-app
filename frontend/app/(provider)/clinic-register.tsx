import { Button, Card, FormScrollView, Input, ProviderFormSection, SectionHeader } from "@/components";
import { routes } from "@/constants/appRoutes";
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

export default function ClinicRegisterScreen() {
  const { clinic, registerClinic } = useProviderWorkspace();
  const [name, setName] = useState(clinic.name);
  const [city, setCity] = useState(clinic.city);
  const [address, setAddress] = useState(clinic.address);
  const [phone, setPhone] = useState(clinic.phone);
  const [description, setDescription] = useState(clinic.description);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const onSubmit = () => {
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
    if (Object.keys(e).length > 0) {
      setFormError("Дутуу эсвэл буруу талбаруудыг засаад дахин оролдоно уу.");
      return;
    }
    setFormError(null);
    setLoading(true);
    void (async () => {
      try {
        await registerClinic({
          name: name.trim(),
          city: city.trim(),
          address: address.trim(),
          phone: phone.trim(),
          description: description.trim(),
        });
        router.replace(routes.providerClinicProfile);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Бүртгүүлэхэд алдаа гарлаа.";
        setFormError(msg);
      } finally {
        setLoading(false);
      }
    })();
  };

  return (
    <>
      <Stack.Screen options={{ title: "Эмнэлэг бүртгэх" }} />
      <FormScrollView
        className="flex-1 bg-slate-50 dark:bg-slate-950"
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      >
        <SectionHeader
          title="Эмнэлэг бүртгэх"
          subtitle="Үйлчлүүлэгчийн апп дээр харагдах мэдээллийг бүрэн бөглөнө үү. Нэг талбар ч буруу бол илгээх боломжгүй."
        />

        <Card className="mb-4">
          <ProviderFormSection
            title="Үндсэн мэдээлэл"
            description="Эмнэлгийн нэр, холбоо барих дугаар нь үйлчлүүлэгчид шууд харагдана."
          >
            <Input
              label="Эмнэлгийн албан нэр"
              value={name}
              onChangeText={setName}
              placeholder="Жишээ: Нэгдсэн анагаах ухааны төв"
              maxLength={191}
              error={errors.name}
              hint="Хамгийн багадаа 2 тэмдэгт."
            />
            <Input
              label="Утасны дугаар"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              placeholder="99112233 эсвэл 75123456"
              error={errors.phone}
              hint="8–15 оронтой дугаар. Зай, зураас автоматаар тооцогдоно."
            />
            <Input
              label="Хот / аймаг / дүүрэг"
              value={city}
              onChangeText={setCity}
              placeholder="Улаанбаатар, Сүхбаатар дүүрэг"
              maxLength={128}
              error={errors.city}
              hint="Үйлчлүүлэгч хайлт, шүүлтэд ашиглагдана."
            />
          </ProviderFormSection>
        </Card>

        <Card className="mb-4">
          <ProviderFormSection
            title="Байршил ба танилцуулга"
            description="Хаяг бүрэн, ойлгомжтой байх нь итгэл үүсгэхэд чухал. Танилцуулга сонголттой ч зөвлөмжтэй."
          >
            <Input
              label="Дэлгэрэнгүй хаяг"
              value={address}
              onChangeText={setAddress}
              placeholder="Дүүрэг, хороо, гудамж, байр, давхар"
              multiline
              maxLength={500}
              error={errors.address}
              hint="Хамгийн багадаа 5 тэмдэгт. Дээд тал нь 500 тэмдэгт."
            />
            <Input
              label="Товч танилцуулга"
              value={description}
              onChangeText={setDescription}
              placeholder="Ямар чиглэлээр үйлчилгээ үзүүлдэг, онцлог юу вэ?"
              multiline
              maxLength={DESC_MAX}
              error={errors.description}
              hint={`Сонголттой. Хэрэглэсэн: ${description.length} / ${DESC_MAX} тэмдэгт.`}
            />
          </ProviderFormSection>
        </Card>

        {formError ? (
          <View className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/50 dark:bg-red-950/40">
            <Text className="text-sm font-medium text-red-800 dark:text-red-200">{formError}</Text>
          </View>
        ) : null}

        <Button label="Бүртгэл илгээх" loading={loading} onPress={onSubmit} />
        <Text className="mt-3 text-center text-xs leading-5 text-slate-500 dark:text-slate-400">
          Илгээсний дараа админ баталгаажуулалт хийгдэх хүртэл зарим үйлдэл хязгаарлагдмал байж болно.
        </Text>
        <Button label="Буцах" variant="ghost" className="mt-2" onPress={() => router.back()} />
      </FormScrollView>
    </>
  );
}
