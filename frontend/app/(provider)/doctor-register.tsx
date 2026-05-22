import { Button, Card, DoctorPhotoPickerField, FormScrollView, Input, ProviderFormSection, SectionHeader } from "@/components";
import { routes } from "@/constants/appRoutes";
import { setDoctorPhotoOverride } from "@/data/healthcare/doctorPhotoOverridesStore";
import { upsertProviderDoctorProfile } from "@/data/healthcare/providerDoctorProfiles";
import { useProviderWorkspace } from "@/contexts/ProviderWorkspaceContext";
import { copyPickedDoctorImageToPersistentFile } from "@/lib/doctorPhotoFile";
import {
  validateDoctorNameMn,
  validatePriceMntMn,
  validateServiceDurationMn,
} from "@/lib/providerFormValidators";
import { router, Stack } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

export default function DoctorRegisterScreen() {
  const { addDoctor, addService, addSlot, clinic, categories, updateDoctor, refreshWorkspace } = useProviderWorkspace();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [title, setTitle] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [bio, setBio] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [galleryUri, setGalleryUri] = useState<string | null>(null);
  const [primaryFocus, setPrimaryFocus] = useState("");
  const [subSpecialty, setSubSpecialty] = useState("");
  const [education, setEducation] = useState("");
  const [workExperience, setWorkExperience] = useState("");
  const [licenseInfo, setLicenseInfo] = useState("");
  const [onlineEnabled, setOnlineEnabled] = useState(true);
  const [ambulatoryEnabled, setAmbulatoryEnabled] = useState(true);
  const [serviceTypes, setServiceTypes] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("30");
  const [priceMnt, setPriceMnt] = useState("50000");
  const [workingDays, setWorkingDays] = useState<string[]>(["Даваа", "Лхагва", "Баасан"]);
  const [timeRange, setTimeRange] = useState("09:00-18:00");
  const [breakTime, setBreakTime] = useState("13:00-14:00");
  const [slotMinutes, setSlotMinutes] = useState("30");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const stepTitles = [
    "1. Үндсэн мэдээлэл",
    "2. Мэргэжлийн дэлгэрэнгүй",
    "3. Зөвлөгөө ба үйлчилгээ",
    "4. Хуваарь ба слот",
  ];

  const dayChoices = ["Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба", "Ням"];
  const dayMap: Record<string, number> = {
    Ням: 0,
    Даваа: 1,
    Мягмар: 2,
    Лхагва: 3,
    Пүрэв: 4,
    Баасан: 5,
    Бямба: 6,
  };

  function parseMinutes(value: string): number | null {
    const [h, m] = value.split(":").map((x) => Number(x));
    if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
    if (h < 0 || h > 23 || m < 0 || m > 59) return null;
    return h * 60 + m;
  }

  function minuteToHHmm(min: number): string {
    const h = Math.floor(min / 60)
      .toString()
      .padStart(2, "0");
    const m = (min % 60).toString().padStart(2, "0");
    return `${h}:${m}`;
  }

  function buildSlotsForNext14Days(): Array<{ dateIso: string; startTime: string; endTime: string }> {
    const [fromRaw, toRaw] = timeRange.split("-").map((x) => x.trim());
    const [breakFromRaw, breakToRaw] = breakTime.split("-").map((x) => x.trim());
    const from = parseMinutes(fromRaw);
    const to = parseMinutes(toRaw);
    const breakFrom = parseMinutes(breakFromRaw);
    const breakTo = parseMinutes(breakToRaw);
    const slot = Number(slotMinutes);
    if (from == null || to == null || !slot || slot <= 0 || from >= to) return [];

    const selectedDays = new Set(workingDays.map((d) => dayMap[d]));
    const slots: Array<{ dateIso: string; startTime: string; endTime: string }> = [];
    for (let i = 0; i < 14; i += 1) {
      const dt = new Date();
      dt.setDate(dt.getDate() + i);
      const weekDay = dt.getDay();
      if (!selectedDays.has(weekDay)) continue;
      const dateIso = dt.toISOString().slice(0, 10);
      let cursor = from;
      while (cursor + slot <= to) {
        const next = cursor + slot;
        const touchesBreak =
          breakFrom != null && breakTo != null && !(next <= breakFrom || cursor >= breakTo);
        if (!touchesBreak) {
          slots.push({
            dateIso,
            startTime: `${minuteToHHmm(cursor)}:00`,
            endTime: `${minuteToHHmm(next)}:00`,
          });
        }
        cursor = next;
      }
    }
    return slots;
  }

  function validateHhMmRange(label: string, raw: string): string | null {
    const parts = raw.split("-").map((x) => x.trim());
    if (parts.length < 2) return `${label}: эхлэл-дуусах хоёр цаг оруулна уу (жишээ 09:00-18:00).`;
    const re = /^\d{1,2}:\d{2}$/;
    if (!re.test(parts[0]!) || !re.test(parts[1]!)) return `${label}: цаг HH:mm хэлбэртэй байна.`;
    const a = parseMinutes(parts[0]!);
    const b = parseMinutes(parts[1]!);
    if (a == null || b == null || a >= b) return `${label}: эхлэл нь төгсгөлөөс өмнө байх ёстой.`;
    return null;
  }

  const validateStep = (stepNumber: number) => {
    const e: Record<string, string> = {};
    if (stepNumber === 1) {
      const ne = validateDoctorNameMn(name);
      if (ne) e.name = ne;
      if (!specialty.trim() || specialty.trim().length < 2) e.specialty = "Мэргэжил хамгийн багадаа 2 тэмдэгт.";
      if (!title.trim()) e.title = "Зэрэг / албан тушаал оруулна уу.";
      if (!experienceYears.trim()) e.experienceYears = "Туршлагын жил оруулна уу.";
      else {
        const y = Number(experienceYears);
        if (!Number.isInteger(y) || y < 0 || y > 60) e.experienceYears = "Туршлага 0–60 бүхэл тоо байна.";
      }
      if (!bio.trim()) e.bio = "Танилцуулга оруулна уу.";
      else if (bio.trim().length > 2000) e.bio = "Танилцуулга 2000 тэмдэгтээс уртгүй байна.";
    }
    if (stepNumber === 2) {
      if (!primaryFocus.trim()) e.primaryFocus = "Үндсэн чиглэл оруулна уу.";
      if (!subSpecialty.trim()) e.subSpecialty = "Дэд мэргэжил оруулна уу.";
      if (!education.trim()) e.education = "Боловсрол оруулна уу.";
      else if (education.trim().length > 4000) e.education = "Боловсрол хэт урт байна (хамгийн ихдээ 4000 тэмдэгт).";
      if (!workExperience.trim()) e.workExperience = "Ажлын туршлага оруулна уу.";
      else if (workExperience.trim().length > 4000) e.workExperience = "Ажлын туршлага хэт урт байна.";
      if (licenseInfo.trim().length > 2000) e.licenseInfo = "Лицензийн мэдээлэл 2000 тэмдэгтээс уртгүй байна.";
    }
    if (stepNumber === 3) {
      if (!onlineEnabled && !ambulatoryEnabled) e.serviceMode = "Доод тал нь нэг зөвлөгөөний төрлийг сонгоно уу.";
      if (!serviceTypes.trim()) e.serviceTypes = "Үйлчилгээний төрлүүд оруулна уу.";
      const dur = Number(durationMinutes);
      const de = validateServiceDurationMn(dur);
      if (de) e.durationMinutes = de;
      if (ambulatoryEnabled) {
        const pr = Number(priceMnt);
        const pe = validatePriceMntMn(pr, true);
        if (pe) e.priceMnt = pe;
      }
    }
    if (stepNumber === 4) {
      if (workingDays.length === 0) e.workingDays = "Ажиллах өдрүүд сонгоно уу.";
      const tr = validateHhMmRange("Өдрийн цагийн хүрээ", timeRange);
      if (tr) e.timeRange = tr;
      const br = validateHhMmRange("Завсарлага", breakTime);
      if (br) e.breakTime = br;
      const slotN = Number(slotMinutes);
      if (!slotMinutes.trim() || Number.isNaN(slotN) || slotN < 5 || slotN > 120) {
        e.slotMinutes = "Слот 5–120 минутын хооронд байна.";
      }
      if (Object.keys(e).length === 0) {
        const slotsPreview = buildSlotsForNext14Days();
        if (slotsPreview.length === 0) {
          e.timeRange = "Сонгосон өдөр, цаг, слотын тохиргоогоор боломжит цаг үүсэхгүй байна. Шалгана уу.";
        }
      }
    }
    return e;
  };

  const onSave = () => {
    const clinicIdNum = Number(clinic.id);
    if (!Number.isInteger(clinicIdNum) || clinicIdNum <= 0) {
      setFormError("Эмнэлгийн мэдээлэл дутуу байна. Эхлээд эмнэлгээ бүртгэж/шинэчлээд дахин оролдоно уу.");
      void refreshWorkspace();
      return;
    }

    const stepErrors = validateStep(step);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) {
      setFormError("Доорх талбаруудыг засаад дахин оролдоно уу.");
      return;
    }
    setFormError(null);
    if (step < 4) {
      setStep((prev) => prev + 1);
      return;
    }
    setLoading(true);
    void (async () => {
      try {
        const doctor = await addDoctor({
          clinicId: String(clinicIdNum),
          name: name.trim(),
          specialty: specialty.trim(),
          title: title.trim(),
          experienceYears: Number(experienceYears) || undefined,
          bio: bio.trim(),
          primaryFocus: primaryFocus.trim(),
          subSpecialty: subSpecialty.trim(),
          education: education.trim(),
          workExperience: workExperience.trim(),
          licenseInfo: licenseInfo.trim(),
          supportsOnlineConsultation: onlineEnabled,
          supportsAmbulatoryConsultation: ambulatoryEnabled,
        });

        let finalImage: string | undefined;
        if (galleryUri) {
          const persistent = await copyPickedDoctorImageToPersistentFile(galleryUri, doctor.id);
          await setDoctorPhotoOverride(doctor.id, persistent);
          finalImage = persistent;
        } else if (imageUrl.trim()) {
          finalImage = imageUrl.trim();
          await setDoctorPhotoOverride(doctor.id, finalImage);
        }
        if (finalImage) await updateDoctor(doctor.id, { imageUrl: finalImage });

        upsertProviderDoctorProfile({
          doctorId: doctor.id,
          title: title.trim(),
          primaryFocus: primaryFocus.trim(),
          subSpecialty: subSpecialty.trim(),
          education: education.trim(),
          workExperience: workExperience.trim(),
          licenseInfo: licenseInfo.trim(),
          imageUrl: finalImage,
          supportsOnlineConsultation: onlineEnabled,
          supportsAmbulatoryConsultation: ambulatoryEnabled,
          workingDays,
          dayTimeRange: timeRange.trim(),
          breakTime: breakTime.trim(),
        });

        const svcTitles = serviceTypes
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);
        const duration = Number(durationMinutes) || 30;
        const price = Math.max(0, Number(priceMnt) || 0);
        let ambulatoryServiceId: string | undefined;
        for (const titleItem of svcTitles) {
          if (onlineEnabled) {
            await addService(
              {
                doctorId: doctor.id,
                categoryId: categories[0]?.id,
                title: `${titleItem} (онлайн)`,
                durationMinutes: duration,
                kind: "free_online",
                isOnline: true,
                isAmbulatory: false,
                priceMnt: 0,
                description: `${name.trim()} эмчийн онлайн зөвлөгөө`,
              },
              { deferRefresh: true },
            );
          }
          if (ambulatoryEnabled) {
            const createdId = await addService(
              {
                doctorId: doctor.id,
                categoryId: categories[0]?.id,
                title: `${titleItem} (амбулатор)`,
                durationMinutes: duration,
                kind: "formal",
                isOnline: false,
                isAmbulatory: true,
                priceMnt: price,
                description: `${name.trim()} эмчийн амбулаторын үзлэг`,
              },
              { deferRefresh: true },
            );
            if (createdId) ambulatoryServiceId = createdId;
          }
        }
        await refreshWorkspace();

        if (ambulatoryEnabled && !ambulatoryServiceId) {
          throw new Error("Амбулаторийн үйлчилгээ үүсээгүй байна. 3-р алхам дахин шалгана уу.");
        }

        const generatedSlots = buildSlotsForNext14Days();
        if (onlineEnabled) {
          for (const slot of generatedSlots) {
            await addSlot(
              {
                doctorId: doctor.id,
                dateIso: slot.dateIso,
                startTime: slot.startTime,
                endTime: slot.endTime,
                consultationType: "free_consultation",
                serviceId: null,
              },
              { deferRefresh: true },
            );
          }
        }
        if (ambulatoryEnabled && ambulatoryServiceId) {
          for (const slot of generatedSlots) {
            await addSlot(
              {
                doctorId: doctor.id,
                dateIso: slot.dateIso,
                startTime: slot.startTime,
                endTime: slot.endTime,
                consultationType: "paid_visit",
                serviceId: ambulatoryServiceId,
              },
              { deferRefresh: true },
            );
          }
        }
        await refreshWorkspace();
        router.replace(routes.providerDoctors);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Хадгалахад алдаа гарлаа.";
        setFormError(msg);
      } finally {
        setLoading(false);
      }
    })();
  };

  return (
    <>
      <Stack.Screen options={{ title: "Эмч бүртгэх" }} />
      <FormScrollView
        className="flex-1 bg-app-bg"
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
      >
        <SectionHeader
          title="Эмч бүртгэх"
          subtitle="Дөрвөн алхамтай: үндсэн мэдээлэл, мэргэжил, үйлчилгээ, хуваарь. Алхам бүрт шалгалт хийгдэнэ."
        />
        {formError ? (
          <Card className="mb-3 border border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/40">
            <Text className="text-sm font-medium text-red-800 dark:text-red-200">{formError}</Text>
          </Card>
        ) : null}
        <Card>
          <Text className="mb-1 text-xs font-medium uppercase tracking-wide text-app-text-muted">
            Алхам {step} / 4
          </Text>
          <Text className="mb-4 text-base font-semibold text-app-text">{stepTitles[step - 1]}</Text>

          {step === 1 ? (
            <>
              <ProviderFormSection
                title="Эмчийн үндсэн мэдээлэл"
                description="Өвчтөнд харагдах нэр, мэргэжил, товч танилцуулга."
              />
              <Input
                label="Овог нэр"
                value={name}
                onChangeText={setName}
                placeholder="Жишээ: Д. Энхтүвшин"
                autoCapitalize="words"
                maxLength={120}
                hint="Бүртгэлд харагдах бүтэн нэр."
                error={errors.name}
              />
              <Input
                label="Мэргэжил"
                value={specialty}
                onChangeText={setSpecialty}
                placeholder="Жишээ: Зүрх судас"
                maxLength={128}
                hint="Үндсэн мэргэжлийн чиглэл."
                error={errors.specialty}
              />
              <Input
                label="Зэрэг / албан тушаал"
                value={title}
                onChangeText={setTitle}
                placeholder="Жишээ: Ахлах эмч"
                maxLength={120}
                hint="Жишээ нь: эмч, ахлах эмч, профессор."
                error={errors.title}
              />
              <Input
                label="Ажлын туршлага (жил)"
                value={experienceYears}
                onChangeText={setExperienceYears}
                keyboardType="number-pad"
                placeholder="8"
                maxLength={3}
                hint="0–60 хооронд бүхэл тоо."
                error={errors.experienceYears}
              />
              <Input
                label="Танилцуулга"
                value={bio}
                onChangeText={setBio}
                placeholder="Өвчтөнд харагдах товч танилцуулга…"
                multiline
                maxLength={2000}
                hint={`${bio.length}/2000 тэмдэгт`}
                error={errors.bio}
              />
              <ProviderFormSection title="Зураг" description="Галерейгаас сонгох эсвэл вэб холбоос (заавал биш)." />
              <DoctorPhotoPickerField
                nameForFallback={name.trim() || "Эмч"}
                previewUri={galleryUri || (imageUrl.trim() || null)}
                onPicked={(uri) => setGalleryUri(uri)}
                showClearButton={galleryUri != null}
                onClear={() => setGalleryUri(null)}
              />
              <Input
                label="Вэб зургийн холбоос"
                value={imageUrl}
                onChangeText={setImageUrl}
                placeholder="Зургийн холбоос (заавал биш)"
                autoCapitalize="none"
                keyboardType="url"
                maxLength={2048}
                hint="Галерейн зураг сонгосон бол энэ талбарыг хоосон үлдээж болно."
              />
            </>
          ) : null}

          {step === 2 ? (
            <>
              <ProviderFormSection
                title="Мэргэжлийн дэлгэрэнгүй"
                description="Чиглэл, боловсрол, туршлага — илүү нарийвчилсан профайл."
              />
              <Input
                label="Үндсэн чиглэл"
                value={primaryFocus}
                onChangeText={setPrimaryFocus}
                placeholder="Жишээ: Зүрхний оношилгоо"
                maxLength={191}
                error={errors.primaryFocus}
              />
              <Input
                label="Дэд мэргэжил / арга хэрэгсэл"
                value={subSpecialty}
                onChangeText={setSubSpecialty}
                placeholder="Жишээ: ЭХО, ЭКГ"
                maxLength={191}
                error={errors.subSpecialty}
              />
              <Input
                label="Боловсрол"
                value={education}
                onChangeText={setEducation}
                placeholder="Сургууль, зэрэг, он жил…"
                multiline
                maxLength={4000}
                hint={`${education.length}/4000 тэмдэгт`}
                error={errors.education}
              />
              <Input
                label="Ажлын туршлага"
                value={workExperience}
                onChangeText={setWorkExperience}
                placeholder="Ажилласан газар, үүрэг, он жил…"
                multiline
                maxLength={4000}
                hint={`${workExperience.length}/4000 тэмдэгт`}
                error={errors.workExperience}
              />
              <Input
                label="Лиценз / сертификат"
                value={licenseInfo}
                onChangeText={setLicenseInfo}
                placeholder="Дугаар, огноо, байгууллага…"
                multiline
                maxLength={2000}
                hint={`${licenseInfo.length}/2000 тэмдэгт`}
                error={errors.licenseInfo}
              />
            </>
          ) : null}

          {step === 3 ? (
            <>
              <ProviderFormSection
                title="Зөвлөгөөний төрөл"
                description="Онлайн нь үнэгүй зөвлөгөөний загвар; амбулатор — төлбөртэй үзлэг. Хамгийн багадаа нэгийг сонгоно."
              />
              <View className="mb-3 gap-2">
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: onlineEnabled }}
                  className={`rounded-xl border px-3 py-3 ${onlineEnabled ? "border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-900" : "border-app-border bg-app-card"}`}
                  onPress={() => setOnlineEnabled((p) => !p)}
                >
                  <Text className="text-sm font-medium text-app-text">Онлайн зөвлөгөө</Text>
                  <Text className="mt-1 text-xs text-app-text-muted">Үнэгүй, чат/видео загвар.</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: ambulatoryEnabled }}
                  className={`rounded-xl border px-3 py-3 ${ambulatoryEnabled ? "border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-900" : "border-app-border bg-app-card"}`}
                  onPress={() => setAmbulatoryEnabled((p) => !p)}
                >
                  <Text className="text-sm font-medium text-app-text">Амбулаторийн үзлэг</Text>
                  <Text className="mt-1 text-xs text-app-text-muted">Цаг захиалгатай, үнэ шаардлагатай.</Text>
                </Pressable>
              </View>
              {errors.serviceMode ? <Text className="mb-3 text-xs text-red-600 dark:text-red-400">{errors.serviceMode}</Text> : null}
              <ProviderFormSection title="Үйлчилгээ" description="Таслалаар тусгаарлан олон нэр оруулж болно." />
              <Input
                label="Үйлчилгээний нэрүүд"
                value={serviceTypes}
                onChangeText={setServiceTypes}
                placeholder="Зүрхний үзлэг, Даралт хяналт"
                maxLength={400}
                hint="Жишээ: Үзлэг 1, Үзлэг 2 — таслалаар тусгаарлана."
                error={errors.serviceTypes}
              />
              <Input
                label="Үргэлжлэх хугацаа (минут)"
                value={durationMinutes}
                onChangeText={setDurationMinutes}
                keyboardType="number-pad"
                placeholder="30"
                maxLength={3}
                hint="5–240 минут."
                error={errors.durationMinutes}
              />
              <Input
                label="Амбулаторын үнэ (₮)"
                value={priceMnt}
                onChangeText={setPriceMnt}
                keyboardType="number-pad"
                placeholder="50000"
                editable={ambulatoryEnabled}
                hint={ambulatoryEnabled ? "Төлбөртэй үзлэгт 0-ээс их үнэ оруулна." : "Амбулатор идэвхгүй бол үнэ шаардахгүй."}
                error={errors.priceMnt}
              />
            </>
          ) : null}

          {step === 4 ? (
            <>
              <ProviderFormSection
                title="Ажиллах өдөр"
                description="Дор хаяж нэг өдөр сонгоно. Сонгосон өдрүүдээр ирэх 14 хоногийн слот үүснэ."
              />
              <View className="mb-2 flex-row flex-wrap gap-2">
                {dayChoices.map((d) => {
                  const active = workingDays.includes(d);
                  return (
                    <Pressable
                      key={d}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      className={`min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border px-3 py-2 ${active ? "border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-900" : "border-app-border bg-app-card"}`}
                      onPress={() =>
                        setWorkingDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]))
                      }
                    >
                      <Text className="text-sm text-app-text-secondary">{d}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {errors.workingDays ? <Text className="mb-3 text-xs text-red-600 dark:text-red-400">{errors.workingDays}</Text> : null}
              <ProviderFormSection title="Цагийн хүрээ ба слот" description="HH:mm-HH:mm хэлбэр. Завсарлага слот үүсэхээс хасагдана." />
              <Input
                label="Өдрийн цагийн хүрээ"
                value={timeRange}
                onChangeText={setTimeRange}
                placeholder="09:00-18:00"
                autoCapitalize="none"
                maxLength={32}
                hint="Эхлэл ба төгсгөл — таслалаар тусгаарлана (жишээ 09:00-18:00)."
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
              <Input
                label="Слотын урт (минут)"
                value={slotMinutes}
                onChangeText={setSlotMinutes}
                keyboardType="number-pad"
                placeholder="30"
                maxLength={3}
                hint="5–120 минут. Үргэлжлэх хугацаатай ойр утга сонгох нь зөв."
                error={errors.slotMinutes}
              />
              <Text className="text-xs leading-5 text-app-text-muted">
                Хадгалахад сонгосон өдрүүдээр ирэх 14 хоногийн боломжит цаг автоматаар үүснэ. Одоогийн тохиргоогоор слот гарвал л дараагийн алхам руу гарна.
              </Text>
            </>
          ) : null}
        </Card>
        {step > 1 ? (
          <Button label="Өмнөх" variant="ghost" className="mt-4" onPress={() => setStep((prev) => Math.max(1, prev - 1))} />
        ) : null}
        <Button label={step === 4 ? "Эмчийн мэдээлэл хадгалах" : "Дараах"} className="mt-2" loading={loading} onPress={onSave} />
        <Button label="Буцах" variant="ghost" className="mt-2" onPress={() => router.back()} />
      </FormScrollView>
    </>
  );
}
