import { Button, Card, FormScrollView, Input, ProviderFormSection, SectionHeader } from "@/components";
import { routes } from "@/constants/appRoutes";
import { useProviderWorkspace } from "@/contexts/ProviderWorkspaceContext";
import {
  validatePriceMntMn,
  validateServiceDurationMn,
  validateServiceTitleMn,
  validateDescriptionMn,
} from "@/lib/providerFormValidators";
import { router, Stack } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

export default function ServiceNewScreen() {
  const { doctors, categories, addService } = useProviderWorkspace();
  const [doctorId, setDoctorId] = useState(doctors[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("30");
  const [isOnline, setIsOnline] = useState(true);
  const [isAmbulatory, setIsAmbulatory] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [price, setPrice] = useState("45000");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSave = () => {
    const e: Record<string, string> = {};
    const te = validateServiceTitleMn(title);
    if (te) e.title = te;
    if (!doctorId) e.doctor = "Эмч сонгоно уу.";
    if (!categoryId) e.cat = "Ангилал сонгоно уу.";
    const d = Number.parseInt(duration, 10);
    const de = validateServiceDurationMn(d);
    if (de) e.duration = de;
    if (!isOnline && !isAmbulatory) e.modes = "Доод тал нь нэг төрлийг сонгоно уу.";
    if (isAmbulatory) {
      const p = Number.parseInt(price, 10);
      const pe = validatePriceMntMn(p, true);
      if (pe) e.price = pe;
    }
    const descErr = validateDescriptionMn(description, 2000);
    if (descErr) e.description = descErr;
    setErrors(e);
    if (Object.keys(e).length > 0) {
      setFormError("Доорх талбаруудыг засаад дахин оролдоно уу.");
      return;
    }
    setFormError(null);
    const nextKind = isOnline && !isAmbulatory ? "free_online" : "formal";
    setLoading(true);
    void (async () => {
      try {
        await addService({
          doctorId,
          categoryId,
          title: title.trim(),
          durationMinutes: d,
          kind: nextKind,
          isOnline,
          isAmbulatory,
          isActive,
          priceMnt: isAmbulatory ? Number.parseInt(price, 10) : 0,
          description: description.trim() || "Тайлбар байхгүй.",
        });
        router.replace(routes.providerServices);
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
      <Stack.Screen options={{ title: "Шинэ үйлчилгээ нэмэх" }} />
      <FormScrollView
        className="flex-1 bg-app-bg"
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
      >
        <SectionHeader
          title="Шинэ үйлчилгээ нэмэх"
          subtitle="Эмч, ангилал сонгоод үргэлжлэх хугацаа, төрөл, үнэ (амбулатор) тохируулна."
        />
        {formError ? (
          <Card className="mb-3 border border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/40">
            <Text className="text-sm font-medium text-red-800 dark:text-red-200">{formError}</Text>
          </Card>
        ) : null}
        <Card>
          <ProviderFormSection
            title="Эмч ба ангилал"
            description="Үйлчилгээг аль эмчийн профайлтай холбох, ямар ангилалд харуулахыг сонгоно."
          >
            {noDoctors ? (
              <Text className="mb-3 text-sm leading-5 text-amber-800 dark:text-amber-200">
                Эмч бүртгэлгүй байна. Эхлээд «Эмч бүртгэх»-ээр эмч нэмээд дахин орж ирнэ үү.
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
            {errors.doctor ? <Text className="mb-3 text-xs text-red-600 dark:text-red-400">{errors.doctor}</Text> : null}

            {categories.length === 0 ? (
              <Text className="mb-3 text-sm text-amber-800 dark:text-amber-200">Ангилал олдсонгүй. Системийн тохиргоог шалгана уу.</Text>
            ) : (
              <View className="mb-2 flex-row flex-wrap gap-2">
                {categories.map((c) => (
                  <Button
                    key={c.id}
                    label={c.name}
                    variant={categoryId === c.id ? "primary" : "outline"}
                    className="min-w-[45%] flex-1"
                    onPress={() => setCategoryId(c.id)}
                  />
                ))}
              </View>
            )}
            {errors.cat ? <Text className="mb-2 text-xs text-red-600 dark:text-red-400">{errors.cat}</Text> : null}
          </ProviderFormSection>
        </Card>
        <Card className="mt-3">
          <ProviderFormSection title="Үйлчилгээ" description="Нэр, хугацаа, өвчтөнд харагдах тайлбар.">
            <Input
              label="Үйлчилгээний нэр"
              value={title}
              onChangeText={setTitle}
              placeholder="Жишээ: Зүрхний үзлэг (онлайн)"
              maxLength={191}
              hint="Хамгийн багадаа 2 тэмдэгт."
              error={errors.title}
            />
            <Input
              label="Үргэлжлэх хугацаа (минут)"
              value={duration}
              onChangeText={setDuration}
              keyboardType="number-pad"
              maxLength={3}
              hint="5–240 минут."
              error={errors.duration}
            />
          </ProviderFormSection>
          <ProviderFormSection
            title="Зөвлөгөөний төрөл"
            description="Онлайн — үнэгүй загвар; амбулатор — төлбөртэй. Хоёуланг нь зэрэг сонгож болно."
          >
            <View className="mb-3 gap-2">
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isOnline }}
                className={`min-h-[48px] justify-center rounded-xl border px-3 py-3 ${isOnline ? "border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-900" : "border-app-border bg-app-card"}`}
                onPress={() => setIsOnline((p) => !p)}
              >
                <Text className="text-sm font-medium text-app-text">Онлайн зөвлөгөө</Text>
                <Text className="mt-1 text-xs text-app-text-muted">Үнэгүй, чат/видео загвар.</Text>
              </Pressable>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isAmbulatory }}
                className={`min-h-[48px] justify-center rounded-xl border px-3 py-3 ${isAmbulatory ? "border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-900" : "border-app-border bg-app-card"}`}
                onPress={() => setIsAmbulatory((p) => !p)}
              >
                <Text className="text-sm font-medium text-app-text">Амбулаторийн үзлэг</Text>
                <Text className="mt-1 text-xs text-app-text-muted">Цаг захиалгатай, үнэ шаардлагатай.</Text>
              </Pressable>
            </View>
            {errors.modes ? <Text className="mb-2 text-xs text-red-600 dark:text-red-400">{errors.modes}</Text> : null}
            {isAmbulatory ? (
              <Input
                label="Үнэ (₮)"
                value={price}
                onChangeText={setPrice}
                keyboardType="number-pad"
                maxLength={12}
                hint="Төлбөртэй үзлэгт 0-ээс их үнэ оруулна."
                error={errors.price}
              />
            ) : null}
            <Input
              label="Тайлбар"
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={2000}
              hint={`Заавал биш. ${description.length}/2000 тэмдэгт`}
              placeholder="Өвчтөнд харагдах товч тайлбар…"
              error={errors.description}
            />
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isActive }}
              className={`min-h-[48px] justify-center rounded-xl border px-3 py-3 ${isActive ? "border-emerald-500 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-900/30" : "border-app-border bg-app-card"}`}
              onPress={() => setIsActive((p) => !p)}
            >
              <Text className="text-sm font-medium text-app-text">Идэвхтэй эсэх</Text>
              <Text className="mt-1 text-xs text-app-text-muted">
                {isActive ? "Идэвхтэй: үйлчлүүлэгчид харагдана." : "Идэвхгүй: түр нуусан төлөв."}
              </Text>
            </Pressable>
          </ProviderFormSection>
        </Card>
        <Button label="Хадгалах" className="mt-4" loading={loading} disabled={noDoctors} onPress={onSave} />
        <Button label="Буцах" variant="ghost" className="mt-2" onPress={() => router.back()} />
      </FormScrollView>
    </>
  );
}
