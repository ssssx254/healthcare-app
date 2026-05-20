import { Button, Card, FormScrollView, Input, ProviderFormSection, SectionHeader } from "@/components";
import { routes } from "@/constants/appRoutes";
import { useProviderWorkspace } from "@/contexts/ProviderWorkspaceContext";
import {
  parseTimeRangeFromLabel,
  validateDateIsoMn,
  validateStartBeforeEndHms,
} from "@/lib/slotTimeParse";
import { router, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

export default function AddSlotScreen() {
  const { doctors, services, addSlot } = useProviderWorkspace();
  const [doctorId, setDoctorId] = useState(doctors[0]?.id ?? "");
  const localTodayIso = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = `${now.getMonth() + 1}`.padStart(2, "0");
    const d = `${now.getDate()}`.padStart(2, "0");
    return `${y}-${m}-${d}`;
  };
  const [label, setLabel] = useState("");
  const [dateIso, setDateIso] = useState(localTodayIso());
  const doctorServices = services.filter((s) => s.doctorId === doctorId && s.isActive !== false);
  const [serviceId, setServiceId] = useState("");

  useEffect(() => {
    if (doctorServices.length === 0) {
      setServiceId("");
      return;
    }
    if (!doctorServices.some((s) => s.id === serviceId)) {
      setServiceId(doctorServices[0]!.id);
    }
  }, [doctorId, doctorServices, serviceId]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSave = () => {
    const e: Record<string, string> = {};
    setFormError(null);
    if (!doctorId) e.doc = "Эмч сонгоно уу.";
    if (!serviceId) e.service = "Үйлчилгээ сонгоно уу.";
    const dateErr = validateDateIsoMn(dateIso);
    if (dateErr) e.date = dateErr;
    if (!label.trim()) e.label = "Цагийн хүрээ оруулна уу (жишээ: 10:00 – 11:00).";
    const range = label.trim() ? parseTimeRangeFromLabel(label.trim()) : null;
    if (label.trim() && !range) e.label = "Формат: 10:00 – 11:00 эсвэл 10:00-11:00 (эхлэл ба төгсгөл).";
    if (range) {
      const ord = validateStartBeforeEndHms(range.start, range.end);
      if (ord) e.label = ord;
    }
    setErrors(e);
    if (Object.keys(e).length > 0) {
      setFormError("Доорх талбаруудыг засаад дахин оролдоно уу.");
      return;
    }
    if (!range) return;
    setLoading(true);
    void (async () => {
      try {
        await addSlot({
          doctorId,
          serviceId,
          dateIso: dateIso.trim(),
          startTime: range.start,
          endTime: range.end,
        });
        router.replace(routes.providerSchedule);
      } catch (err) {
        setFormError(err instanceof Error ? err.message : "Хадгалахад алдаа гарлаа.");
      } finally {
        setLoading(false);
      }
    })();
  };

  const noDoctors = doctors.length === 0;

  return (
    <>
      <Stack.Screen options={{ title: "Боломжит цаг нэмэх" }} />
      <FormScrollView
        className="flex-1 bg-app-bg"
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
      >
        <SectionHeader
          title="Боломжит цаг нэмэх"
          subtitle="Тодорхой огноо, эмч, эхлэх–дуусах цагийг оруулна. Өвчтөний цаг товлоход харагдана."
        />
        {formError ? (
          <Card className="mb-3 border border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/40">
            <Text className="text-sm font-medium text-red-800 dark:text-red-200">{formError}</Text>
          </Card>
        ) : null}
        <Card>
          <ProviderFormSection
            title="Эмч"
            description="Энэ цагийг аль эмчийн хуваарьт нэмэх вэ гэдгийг сонгоно."
          >
            {noDoctors ? (
              <Text className="mb-3 text-sm leading-5 text-amber-800 dark:text-amber-200">
                Эмч бүртгэлгүй тул эхлээд эмч нэмнэ үү.
              </Text>
            ) : (
              <View className="mb-2 flex-row flex-wrap gap-2">
                {doctors.map((d) => (
                  <Button
                    key={d.id}
                    label={d.name}
                    variant={doctorId === d.id ? "primary" : "secondary"}
                    className="min-w-[45%] flex-1"
                    onPress={() => setDoctorId(d.id)}
                  />
                ))}
              </View>
            )}
            {errors.doc ? <Text className="mb-2 text-xs text-red-600 dark:text-red-400">{errors.doc}</Text> : null}
            <Text className="mb-2 text-sm font-medium text-app-text">Үйлчилгээ</Text>
            {doctorServices.length === 0 ? (
              <Text className="mb-2 text-xs text-amber-700 dark:text-amber-300">Энэ эмчид идэвхтэй үйлчилгээ алга. Эхлээд үйлчилгээ нэмнэ үү.</Text>
            ) : (
              <View className="mb-2 flex-row flex-wrap gap-2">
                {doctorServices.map((s) => (
                  <Button
                    key={s.id}
                    label={`${s.title} (${s.durationMinutes} мин)`}
                    variant={serviceId === s.id ? "primary" : "outline"}
                    className="min-w-[48%] flex-1"
                    onPress={() => setServiceId(s.id)}
                  />
                ))}
              </View>
            )}
            {errors.service ? <Text className="mb-2 text-xs text-red-600 dark:text-red-400">{errors.service}</Text> : null}
          </ProviderFormSection>
        </Card>
        <Card className="mt-3">
          <ProviderFormSection
            title="Огноо ба цаг"
            description="Огноо нь YYYY-MM-DD. Цаг нь эхлэл–төгсгөл, таслал эсвэл зураасаар тусгаарлана."
          >
            <Input
              label="Огноо"
              value={dateIso}
              onChangeText={setDateIso}
              placeholder="Жишээ: 2026-04-24"
              autoCapitalize="none"
              maxLength={10}
              hint="Жишээ: 2026-04-24 (он-сар-өдөр)."
              error={errors.date}
            />
            <Input
              label="Эхлэх – дуусах цаг"
              value={label}
              onChangeText={setLabel}
              placeholder="Жишээ: 10:00 – 10:30"
              autoCapitalize="none"
              maxLength={40}
              hint="Эхлэл нь төгсгөлөөс өмнө байх ёстой. Зураас (–) эсвэл энгийн таслал (-) ашиглаж болно."
              error={errors.label}
            />
          </ProviderFormSection>
        </Card>
        <Button label="Хадгалах" className="mt-4" loading={loading} disabled={noDoctors} onPress={onSave} />
        <Button label="Буцах" variant="ghost" className="mt-2" onPress={() => router.back()} />
      </FormScrollView>
    </>
  );
}
