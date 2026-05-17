import { Button, Card, DoctorPhotoPickerField, FormScrollView, Input, ProviderFormSection, SectionHeader } from "@/components";
import { routes } from "@/constants/appRoutes";
import { getDoctorManagementConfig, type WeeklyDayKey } from "@/data/healthcare/providerDoctorManagementStore";
import { useProviderWorkspace } from "@/contexts/ProviderWorkspaceContext";
import { doctorApi } from "@/services/api/doctorApi";
import { mapDoctorRow } from "@/services/catalogMappers";
import {
  validateDoctorNameMn,
  validatePhoneMn,
  validateDescriptionMn,
} from "@/lib/providerFormValidators";
import { parseTimeRangeFromLabel, validateStartBeforeEndHms } from "@/lib/slotTimeParse";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

function validateHmDashRange(label: string, raw: string): string | null {
  const t = raw.trim();
  if (!t) return `${label} оруулна уу.`;
  const r = parseTimeRangeFromLabel(t);
  if (!r) return `${label}: жишээ 09:00-18:00 эсвэл 09:00 – 18:00.`;
  return validateStartBeforeEndHms(r.start, r.end);
}

export default function DoctorEditScreen() {
  const { doctorId } = useLocalSearchParams<{ doctorId: string }>();
  const { doctors, services, updateDoctor, updateService, upsertDoctorManagement } = useProviderWorkspace();
  const doc = doctors.find((d) => d.id === doctorId);
  const existingCfg = doctorId ? getDoctorManagementConfig(doctorId) : undefined;
  const doctorServices = services.filter((s) => s.doctorId === doctorId);
  const formalService = doctorServices.find((s) => s.kind === "formal");
  const anyService = formalService ?? doctorServices[0];

  const [name, setName] = useState(doc?.name ?? "");
  const [specialty, setSpecialty] = useState(doc?.specialty ?? "");
  const [title, setTitle] = useState(doc?.title ?? "");
  const [experienceYears, setExperienceYears] = useState(doc?.experienceYears != null ? String(doc.experienceYears) : "");
  const [phone, setPhone] = useState(doc?.phone ?? "");
  const [bio, setBio] = useState(doc?.bio ?? "");
  const [education, setEducation] = useState(doc?.education ?? "");
  const [workExperience, setWorkExperience] = useState(doc?.workExperience ?? "");
  const [durationMinutes, setDurationMinutes] = useState(anyService?.durationMinutes != null ? String(anyService.durationMinutes) : "30");
  const [priceMnt, setPriceMnt] = useState(formalService?.priceMnt != null ? String(formalService.priceMnt) : "50000");
  const [online, setOnline] = useState(existingCfg?.consultation.online ?? true);
  const [ambulatory, setAmbulatory] = useState(existingCfg?.consultation.ambulatory ?? true);
  const [workingDays, setWorkingDays] = useState<WeeklyDayKey[]>(
    existingCfg?.weeklySchedule.workingDays ?? ["mon", "wed", "fri"],
  );
  const [timeRange, setTimeRange] = useState(existingCfg?.weeklySchedule.dayTimeRange ?? "09:00-18:00");
  const [breakTime, setBreakTime] = useState(existingCfg?.weeklySchedule.breakTime ?? "13:00-14:00");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const dayOptions: Array<{ key: WeeklyDayKey; label: string }> = [
    { key: "mon", label: "Даваа" },
    { key: "tue", label: "Мягмар" },
    { key: "wed", label: "Лхагва" },
    { key: "thu", label: "Пүрэв" },
    { key: "fri", label: "Баасан" },
    { key: "sat", label: "Бямба" },
    { key: "sun", label: "Ням" },
  ];

  useEffect(() => {
    if (doc) {
      setName(doc.name);
      setSpecialty(doc.specialty);
      setTitle(doc.title ?? "");
      setExperienceYears(doc.experienceYears != null ? String(doc.experienceYears) : "");
      setPhone(doc.phone ?? "");
      setBio(doc.bio);
      setEducation(doc.education ?? "");
      setWorkExperience(doc.workExperience ?? "");
    }
  }, [doc]);

  if (!doc) {
    return (
      <>
        <Stack.Screen options={{ title: "Эмчийн мэдээлэл засах" }} />
        <FormScrollView className="flex-1 bg-slate-50 p-4 dark:bg-slate-950">
          <Card>
            <Text className="text-center text-slate-600 dark:text-slate-300">Эмч олдсонгүй.</Text>
            <Button label="Жагсаалт руу" className="mt-4" onPress={() => router.replace(routes.providerDoctors)} />
          </Card>
        </FormScrollView>
      </>
    );
  }

  const runValidation = (): Record<string, string> => {
    const e: Record<string, string> = {};
    const ne = validateDoctorNameMn(name);
    if (ne) e.name = ne;
    if (!specialty.trim() || specialty.trim().length < 2) e.specialty = "Мэргэжил хамгийн багадаа 2 тэмдэгт.";
    if (!title.trim()) e.title = "Зэрэг / албан тушаал оруулна уу.";
    if (!experienceYears.trim()) e.experienceYears = "Туршлагын жил оруулна уу.";
    else {
      const y = Number(experienceYears);
      if (!Number.isInteger(y) || y < 0 || y > 60) e.experienceYears = "Туршлага 0–60 бүхэл тоо байна.";
    }
    if (phone.trim()) {
      const pe = validatePhoneMn(phone);
      if (pe) e.phone = pe;
    }
    const be = validateDescriptionMn(bio, 2000);
    if (be) e.bio = be;
    if (!education.trim()) e.education = "Боловсрол оруулна уу.";
    if (!workExperience.trim()) e.workExperience = "Ажлын туршлага оруулна уу.";
    if (!online && !ambulatory) e.serviceMode = "Доод тал нь нэг зөвлөгөөний төрлийг сонгоно уу.";
    const dur = Number(durationMinutes);
    if (!durationMinutes.trim() || !Number.isInteger(dur) || dur < 5 || dur > 240) e.durationMinutes = "Үзлэгийн хугацаа 5–240 минут байна.";
    if (ambulatory) {
      const p = Number(priceMnt);
      if (!priceMnt.trim() || Number.isNaN(p) || p <= 0 || p > 10000000) e.priceMnt = "Үзлэгийн үнэ 1–10,000,000 ₮ хооронд байна.";
    }
    if (workingDays.length === 0) e.workingDays = "Дор хаяж нэг ажиллах өдөр сонгоно уу.";
    const tr = validateHmDashRange("Өдрийн цагийн хүрээ", timeRange);
    if (tr) e.timeRange = tr;
    const br = validateHmDashRange("Завсарлага", breakTime);
    if (br) e.breakTime = br;
    return e;
  };

  const onSave = () => {
    const e = runValidation();
    setErrors(e);
    if (Object.keys(e).length > 0) {
      setFormError("Доорх талбаруудыг засаад дахин оролдоно уу.");
      return;
    }
    setFormError(null);
    setSuccessMessage(null);
    setSaving(true);
    void (async () => {
      try {
        await updateDoctor(doc.id, {
          name: name.trim(),
          specialty: specialty.trim(),
          title: title.trim(),
          experienceYears: Number(experienceYears) || undefined,
          phone: phone.trim() || undefined,
          bio: bio.trim(),
          education: education.trim(),
          workExperience: workExperience.trim(),
        });
        for (const svc of doctorServices) {
          await updateService(svc.id, {
            durationMinutes: Number(durationMinutes),
            priceMnt: svc.kind === "formal" ? Number(priceMnt || 0) : 0,
            isOnline: online && (svc.kind === "free_online" || svc.isOnline),
            isAmbulatory: ambulatory && (svc.kind === "formal" || svc.isAmbulatory),
          });
        }
        upsertDoctorManagement({
          doctorId: doc.id,
          consultation: { online, ambulatory },
          weeklySchedule: {
            workingDays,
            dayTimeRange: timeRange.trim(),
            breakTime: breakTime.trim(),
          },
        });
        setSuccessMessage("Амжилттай хадгалагдлаа.");
        setTimeout(() => {
          router.back();
        }, 650);
      } catch (err) {
        setFormError(err instanceof Error ? err.message : "Хадгалахад алдаа гарлаа.");
      } finally {
        setSaving(false);
      }
    })();
  };

  return (
    <>
      <Stack.Screen options={{ title: "Эмчийн мэдээлэл засах" }} />
      <FormScrollView
        className="flex-1 bg-slate-50 dark:bg-slate-950"
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
      >
        <SectionHeader title="Эмчийн мэдээлэл засах" subtitle="Профайл, зураг, зөвлөгөөний төрөл, долоо хоногийн хуваарь." />
        {formError ? (
          <Card className="mb-3 border border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/40">
            <Text className="text-sm font-medium text-red-800 dark:text-red-200">{formError}</Text>
          </Card>
        ) : null}
        {successMessage ? (
          <Card className="mb-3 border border-emerald-200 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/40">
            <Text className="text-sm font-medium text-emerald-800 dark:text-emerald-200">{successMessage}</Text>
          </Card>
        ) : null}
        <Card>
          <ProviderFormSection title="Зураг" description="Шинэ зураг сонгоход шууд хадгалагдана. Цэвэрлэхэд серверийн анхны зураг сэргэнэ." />
          <DoctorPhotoPickerField
            nameForFallback={doc.name}
            doctorId={doc.id}
            previewUri={doc.imageUrl ?? null}
            onPicked={(uri) => {
              void updateDoctor(doc.id, { imageUrl: uri });
            }}
            showClearButton={!!doc.imageUrl}
            onClear={async () => {
              try {
                const row = await doctorApi.getById(doc.id);
                const mapped = mapDoctorRow(row);
                await updateDoctor(doc.id, { imageUrl: mapped.imageUrl });
              } catch {
                await updateDoctor(doc.id, { imageUrl: undefined });
              }
            }}
          />
        </Card>
        <Card className="mt-3">
          <ProviderFormSection
            title="Үндсэн мэдээлэл"
            description="Өвчтөнд харагдах нэр, мэргэжил, холбоо барих дугаар."
          >
            <Input
              label="Овог нэр"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              maxLength={120}
              hint="Бүртгэлд харагдах бүтэн нэр."
              error={errors.name}
            />
            <Input
              label="Мэргэжил"
              value={specialty}
              onChangeText={setSpecialty}
              maxLength={128}
              hint="Үндсэн мэргэжлийн чиглэл."
              error={errors.specialty}
            />
            <Input
              label="Зэрэг / албан тушаал"
              value={title}
              onChangeText={setTitle}
              maxLength={120}
              error={errors.title}
            />
            <Input
              label="Туршлага (жил)"
              value={experienceYears}
              onChangeText={setExperienceYears}
              keyboardType="number-pad"
              maxLength={3}
              error={errors.experienceYears}
            />
            <Input
              label="Утас (заавал биш)"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={32}
              hint="Оруулсан бол 8–15 оронтой дугаар байх ёстой."
              error={errors.phone}
            />
            <Input
              label="Танилцуулга"
              value={bio}
              onChangeText={setBio}
              multiline
              maxLength={2000}
              hint={`${bio.length}/2000 тэмдэгт`}
              error={errors.bio}
            />
            <Input
              label="Боловсрол"
              value={education}
              onChangeText={setEducation}
              multiline
              maxLength={4000}
              hint={`${education.length}/4000 тэмдэгт`}
              error={errors.education}
            />
            <Input
              label="Ажлын туршлага"
              value={workExperience}
              onChangeText={setWorkExperience}
              multiline
              maxLength={4000}
              hint={`${workExperience.length}/4000 тэмдэгт`}
              error={errors.workExperience}
            />
          </ProviderFormSection>
        </Card>
        <Card className="mt-3">
          <ProviderFormSection
            title="Зөвлөгөөний төрөл"
            description="Онлайн — үнэгүй загвар; амбулатор — цаг захиалгатай. Хамгийн багадаа нэгийг идэвхжүүлнэ."
          >
            <View className="mb-3 gap-2">
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: online }}
                className={`min-h-[48px] justify-center rounded-xl border px-3 py-3 ${online ? "border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-900" : "border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900"}`}
                onPress={() => setOnline((p) => !p)}
              >
                <Text className="text-sm font-medium text-slate-800 dark:text-slate-100">Онлайн зөвлөгөө</Text>
                <Text className="mt-1 text-xs text-slate-500 dark:text-slate-400">Үнэгүй зөвлөгөөний загвар.</Text>
              </Pressable>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: ambulatory }}
                className={`min-h-[48px] justify-center rounded-xl border px-3 py-3 ${ambulatory ? "border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-900" : "border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900"}`}
                onPress={() => setAmbulatory((p) => !p)}
              >
                <Text className="text-sm font-medium text-slate-800 dark:text-slate-100">Амбулаторийн үзлэг</Text>
                <Text className="mt-1 text-xs text-slate-500 dark:text-slate-400">Төлбөртэй цагийн үзлэг.</Text>
              </Pressable>
            </View>
            {errors.serviceMode ? <Text className="mb-2 text-xs text-red-600 dark:text-red-400">{errors.serviceMode}</Text> : null}
            <Input
              label="Үзлэгийн хугацаа (минут)"
              value={durationMinutes}
              onChangeText={setDurationMinutes}
              keyboardType="number-pad"
              maxLength={3}
              error={errors.durationMinutes}
            />
            <Input
              label="Үзлэгийн үнэ (₮)"
              value={priceMnt}
              onChangeText={setPriceMnt}
              keyboardType="number-pad"
              editable={ambulatory}
              hint={ambulatory ? "Амбулаторийн үзлэгийн үнэ." : "Амбулатор идэвхгүй үед үнэ шаардахгүй."}
              error={errors.priceMnt}
            />
          </ProviderFormSection>
          <ProviderFormSection
            title="Долоо хоногийн хуваарь"
            description="Ажиллах өдөр, өдрийн цагийн хүрээ. Хадгалахад үйлчилгээний хугацаанд тулгуурлан слот шинэчлэгдэнэ."
          >
            <View className="mb-2 flex-row flex-wrap gap-2">
              {dayOptions.map((d) => {
                const active = workingDays.includes(d.key);
                return (
                  <Pressable
                    key={d.key}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    className={`min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border px-3 py-2 ${active ? "border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-900" : "border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900"}`}
                    onPress={() =>
                      setWorkingDays((prev) => (prev.includes(d.key) ? prev.filter((x) => x !== d.key) : [...prev, d.key]))
                    }
                  >
                    <Text className="text-xs font-medium text-slate-700 dark:text-slate-200">{d.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            {errors.workingDays ? <Text className="mb-3 text-xs text-red-600 dark:text-red-400">{errors.workingDays}</Text> : null}
            <Input
              label="Өдрийн цагийн хүрээ"
              value={timeRange}
              onChangeText={setTimeRange}
              placeholder="09:00-18:00"
              autoCapitalize="none"
              maxLength={32}
              hint="Жишээ: 09:00-18:00 эсвэл 09:00 – 18:00."
              error={errors.timeRange}
            />
            <Input
              label="Завсарлага"
              value={breakTime}
              onChangeText={setBreakTime}
              placeholder="13:00-14:00"
              autoCapitalize="none"
              maxLength={32}
              hint="Өдрийн дунд завсарлага."
              error={errors.breakTime}
            />
          </ProviderFormSection>
        </Card>
        <Button label="Хадгалах" className="mt-4" loading={saving} onPress={onSave} />
        <Button label="Буцах" variant="ghost" className="mt-2" onPress={() => router.back()} />
      </FormScrollView>
    </>
  );
}
