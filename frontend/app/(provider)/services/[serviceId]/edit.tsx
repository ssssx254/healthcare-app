import { Button, Card, FormScrollView, Input, ProviderFormSection, SectionHeader } from "@/components";
import { routes } from "@/constants/appRoutes";
import { useProviderWorkspace } from "@/contexts/ProviderWorkspaceContext";
import {
  validatePriceMntMn,
  validateServiceDurationMn,
  validateServiceTitleMn,
  validateDescriptionMn,
} from "@/lib/providerFormValidators";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

export default function ServiceEditScreen() {
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  const { services, doctors, categories, updateService } = useProviderWorkspace();
  const svc = services.find((s) => s.id === serviceId);

  const [doctorId, setDoctorId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("30");
  const [isOnline, setIsOnline] = useState(true);
  const [isAmbulatory, setIsAmbulatory] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [price, setPrice] = useState("0");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (svc) {
      setDoctorId(svc.doctorId);
      setCategoryId(svc.categoryId ?? "");
      setTitle(svc.title);
      setDuration(String(svc.durationMinutes));
      setIsOnline(svc.isOnline ?? svc.kind === "free_online");
      setIsAmbulatory(svc.isAmbulatory ?? svc.kind === "formal");
      setIsActive(svc.isActive !== false);
      setPrice(String(svc.priceMnt));
      setDescription(svc.description);
    }
  }, [svc]);

  if (!svc) {
    return (
      <>
        <Stack.Screen options={{ title: "Үйлчилгээ засах" }} />
        <FormScrollView className="flex-1 p-4 bg-app-bg">
          <Card>
            <Text className="text-center text-app-text-secondary">Үйлчилгээ олдсонгүй.</Text>
            <Button label="Жагсаалт руу" className="mt-4" onPress={() => router.replace(routes.providerServices)} />
          </Card>
        </FormScrollView>
      </>
    );
  }

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
    setSuccessMessage(null);
    const p = isAmbulatory ? Number.parseInt(price, 10) : 0;
    const kind = isOnline && !isAmbulatory ? "free_online" : "formal";
    setLoading(true);
    void (async () => {
      try {
        await updateService(svc.id, {
          doctorId,
          categoryId,
          title: title.trim(),
          durationMinutes: d,
          kind,
          isOnline,
          isAmbulatory,
          isActive,
          priceMnt: Number.isNaN(p) ? 0 : p,
          description: description.trim(),
        });
        setSuccessMessage("Амжилттай шинэчлэгдлээ.");
        setTimeout(() => router.back(), 650);
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
      <Stack.Screen options={{ title: "Үйлчилгээ засах" }} />
      <FormScrollView
        className="flex-1 bg-app-bg"
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
      >
        <SectionHeader title="Үйлчилгээ засах" subtitle="Одоогийн үйлчилгээг засварлаад хадгална." />
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
          <ProviderFormSection title="Эмч ба ангилал" description="Үйлчилгээг өөр эмчид шилжүүлэх эсвэл ангилал солих боломжтой.">
            {noDoctors ? (
              <Text className="mb-3 text-sm text-amber-800 dark:text-amber-200">Эмчийн жагсаалт хоосон байна.</Text>
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
            {errors.cat ? <Text className="mb-2 text-xs text-red-600 dark:text-red-400">{errors.cat}</Text> : null}
          </ProviderFormSection>
        </Card>
        <Card className="mt-3">
          <ProviderFormSection title="Үйлчилгээ" description="Нэр, хугацаа, тайлбар.">
            <Input
              label="Үйлчилгээний нэр"
              value={title}
              onChangeText={setTitle}
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
          <ProviderFormSection title="Зөвлөгөөний төрөл" description="Төрөл өөрчлөгдвөл үнэ болон kind автоматаар тохируулагдана.">
            <View className="mb-3 gap-2">
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isOnline }}
                className={`min-h-[48px] justify-center rounded-xl border px-3 py-3 ${isOnline ? "border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-900" : "border-app-border bg-app-card"}`}
                onPress={() => setIsOnline((p) => !p)}
              >
                <Text className="text-sm font-medium text-app-text">Онлайн зөвлөгөө</Text>
                <Text className="mt-1 text-xs text-app-text-muted">Үнэгүй загвар.</Text>
              </Pressable>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isAmbulatory }}
                className={`min-h-[48px] justify-center rounded-xl border px-3 py-3 ${isAmbulatory ? "border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-900" : "border-app-border bg-app-card"}`}
                onPress={() => setIsAmbulatory((p) => !p)}
              >
                <Text className="text-sm font-medium text-app-text">Амбулаторийн үзлэг</Text>
                <Text className="mt-1 text-xs text-app-text-muted">Төлбөртэй.</Text>
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
                hint="Амбулатор идэвхтэй үед 0-ээс их байна."
                error={errors.price}
              />
            ) : null}
            <Input
              label="Тайлбар"
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={2000}
              hint={`${description.length}/2000 тэмдэгт`}
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
