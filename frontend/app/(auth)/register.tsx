import {
  AppContainer,
  AuthMessageBanner,
  Button,
  Card,
  ClinicLogoPickerField,
  EmergencyCallButton,
  FormScrollView,
  Input,
  SectionHeader,
} from "@/components";
import { webAuthScrollContent } from "@/utils/webScrollContent";
import { routes } from "@/constants/appRoutes";
import { submitProviderOnboarding } from "@/data/healthcare/providerOnboardingStore";
import { addAdminClinicReview } from "@/data/healthcare/systemAdmin";
import { useAuth } from "@/hooks/useAuth";
import { ApiError } from "@/lib/api/client";
import { providerOnboardingApi } from "@/services/api/providerOnboardingApi";
import { cn } from "@/utils/cn";
import { Link, router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";

function emailValid(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function phoneValid(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
}

export default function RegisterScreen() {
  const { signUp, signOut } = useAuth();
  const [signupRole, setSignupRole] = useState<"customer" | "provider">("customer");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [providerStep, setProviderStep] = useState(1);
  const [clinicName, setClinicName] = useState("");
  const [clinicRegistrationNumber, setClinicRegistrationNumber] = useState("");
  const [clinicType, setClinicType] = useState<"эмнэлэг" | "төв" | "кабинет" | "зөвлөгөөний төв">("эмнэлэг");
  const [clinicIntro, setClinicIntro] = useState("");
  const [clinicLogoDataUrl, setClinicLogoDataUrl] = useState<string | null>(null);
  const [contactAddress, setContactAddress] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [workingHours, setWorkingHours] = useState("");
  const [cityDistrict, setCityDistrict] = useState("");
  const [serviceDirections, setServiceDirections] = useState("");
  const [hasOnlineConsult, setHasOnlineConsult] = useState(false);
  const [hasAmbulatoryCare, setHasAmbulatoryCare] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const isProviderFlow = signupRole === "provider";
  const providerStepTitles = [
    "1. Аккаунтын мэдээлэл",
    "2. Эмнэлгийн суурь мэдээлэл",
    "3. Холбоо барих ба байршил",
    "4. Үйлчилгээний хүрээ",
    "5. Хянах ба илгээх",
  ];

  const validateProviderStep = (): Record<string, string> => {
    const nextErrors: Record<string, string> = {};
    if (providerStep === 1) {
      if (!fullName.trim()) nextErrors.fullName = "Хариуцсан хүний овог нэрийг бүтэн оруулна уу.";
      if (!email.trim()) nextErrors.email = "Имэйл хаягаа оруулна уу.";
      else if (!emailValid(email)) nextErrors.email = "Имэйл хаягийн формат буруу байна (жишээ: нэр@домэйн.mn).";
      if (!phone.trim()) nextErrors.phone = "Утасны дугаараа оруулна уу.";
      else if (!phoneValid(phone)) nextErrors.phone = "8–15 оронтой зөв утасны дугаар оруулна уу.";
      if (!password.trim()) nextErrors.password = "Нууц үгээ оруулна уу.";
      else if (password.trim().length < 4) nextErrors.password = "Нууц үг дор хаяж 4 тэмдэгт байх ёстой.";
      if (!confirmPassword.trim()) nextErrors.confirmPassword = "Нууц үгээ давтан оруулна уу.";
      else if (confirmPassword !== password) nextErrors.confirmPassword = "Давтсан нууц үг өмнөхтэй таарахгүй байна.";
    }
    if (providerStep === 2) {
      if (!clinicName.trim()) nextErrors.clinicName = "Эмнэлгийн албан нэрийг оруулна уу.";
      if (!clinicRegistrationNumber.trim()) nextErrors.clinicRegistrationNumber = "Регистр / тусгай зөвшөөрлийн дугаараа оруулна уу.";
      if (!clinicIntro.trim()) nextErrors.clinicIntro = "Үйлчлүүлэгчид харагдах товч танилцуулгаа оруулна уу.";
    }
    if (providerStep === 3) {
      if (!contactAddress.trim()) nextErrors.contactAddress = "Эмнэлгийн бүрэн хаягийг оруулна уу.";
      if (!contactPhone.trim()) nextErrors.contactPhone = "Холбоо барих утасны дугаарыг оруулна уу.";
      else if (!phoneValid(contactPhone)) nextErrors.contactPhone = "8–15 оронтой зөв утасны дугаар оруулна уу.";
      if (!contactEmail.trim()) nextErrors.contactEmail = "Холбоо барих имэйлийг оруулна уу.";
      else if (!emailValid(contactEmail)) nextErrors.contactEmail = "Имэйл хаягийн формат буруу байна.";
      if (!workingHours.trim()) nextErrors.workingHours = "Ажиллах цагийн хуваарь оруулна уу (жишээ: Да–Ба 09:00–18:00).";
      if (!cityDistrict.trim()) nextErrors.cityDistrict = "Хот, дүүрэг эсвэл аймаг, сумын нэрийг оруулна уу.";
    }
    if (providerStep === 4) {
      if (!serviceDirections.trim()) nextErrors.serviceDirections = "Үзлэгийн чиглэл, үйлчилгээний төрлөө тодорхой бичнэ үү.";
      if (!hasOnlineConsult && !hasAmbulatoryCare) {
        nextErrors.serviceModes = "Доорхоос хамгийн багадаа нэг сонголтыг идэвхжүүлнэ үү.";
      }
    }
    return nextErrors;
  };

  const onRegister = async () => {
    const nextErrors: Record<string, string> = {};

    if (isProviderFlow && providerStep < 5) {
      const stepErrors = validateProviderStep();
      setErrors(stepErrors);
      if (Object.keys(stepErrors).length > 0) return;
      setFormError(null);
      setProviderStep((prev) => Math.min(prev + 1, 5));
      return;
    }

    if (!fullName.trim()) nextErrors.fullName = "Овог нэрээ бүтэн оруулна уу.";
    if (!email.trim()) nextErrors.email = "Имэйл хаягаа оруулна уу.";
    else if (!emailValid(email)) nextErrors.email = "Имэйл хаягийн формат буруу байна.";
    if (!phone.trim()) nextErrors.phone = "Утасны дугаараа оруулна уу.";
    else if (!phoneValid(phone)) nextErrors.phone = "8–15 оронтой зөв утасны дугаар оруулна уу.";
    if (!password.trim()) nextErrors.password = "Нууц үгээ оруулна уу.";
    else if (password.trim().length < 4) nextErrors.password = "Нууц үг дор хаяж 4 тэмдэгт байх ёстой.";
    if (!confirmPassword.trim()) nextErrors.confirmPassword = "Нууц үгээ давтан оруулна уу.";
    else if (confirmPassword !== password) nextErrors.confirmPassword = "Давтсан нууц үг өмнөхтэй таарахгүй байна.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setFormError(null);
    try {
      setLoading(true);
      const user = await signUp({ name: fullName, email, password, role: signupRole, phone });
      if (signupRole === "provider") {
        const cityDistrictTrim = cityDistrict.trim();
        const locParts = cityDistrictTrim.split(/[,，]/).map((x) => x.trim()).filter(Boolean);
        const cityPart = locParts[0] || cityDistrictTrim;
        const districtPart = locParts.slice(1).join(", ") || locParts[0] || "—";
        const introWithLicense = `Регистр/ТЗ дугаар: ${clinicRegistrationNumber.trim()}\n${clinicIntro.trim()}`;
        try {
          await providerOnboardingApi.submit({
            manager_name: fullName.trim(),
            account_email: email.trim().toLowerCase(),
            account_phone: phone.trim(),
            clinic_name: clinicName.trim(),
            clinic_type: clinicType,
            introduction: introWithLicense,
            logo_url: clinicLogoDataUrl?.trim() || null,
            address: contactAddress.trim(),
            city: cityPart,
            district: districtPart,
            contact_phone: contactPhone.trim(),
            contact_email: contactEmail.trim().toLowerCase(),
            working_hours: workingHours.trim(),
            online_enabled: hasOnlineConsult,
            ambulatory_enabled: hasAmbulatoryCare,
            supported_specialties: `Чиглэл: ${serviceDirections.trim()}; Регистр/ТЗ: ${clinicRegistrationNumber.trim()}`,
          });
        } catch (submitErr) {
          const sm =
            submitErr instanceof ApiError
              ? submitErr.message
              : submitErr instanceof Error
                ? submitErr.message
                : "Илгээлт амжилтгүй.";
          Alert.alert(
            "Анхаар",
            `Бүртгэл үүссэн ч илгээлт серверт хадгалагдсангүй: ${sm}\n\nАдмин таны хүсэлтийг жагсаалтаас баталгаажуулж болно.`,
          );
        }
        submitProviderOnboarding({
          account: {
            email,
            phone,
            contactPersonName: fullName,
          },
          clinic: {
            name: clinicName,
            type: clinicType,
            registrationNumber: clinicRegistrationNumber,
            introduction: clinicIntro,
            logoUrl: clinicLogoDataUrl?.trim() || undefined,
          },
          contact: {
            address: contactAddress,
            phone: contactPhone,
            email: contactEmail,
            workingHours,
            cityDistrict,
          },
          serviceScope: {
            directions: serviceDirections,
            hasOnlineConsultation: hasOnlineConsult,
            hasAmbulatoryCare,
          },
        });
        addAdminClinicReview({
          clinicName: clinicName.trim(),
          ownerName: fullName.trim(),
          city: cityDistrict.trim(),
        });
      }
      if (user.role === "customer") {
        router.replace(routes.customerHome);
      } else if (user.role === "provider") {
        router.replace(routes.providerPending);
      } else if (user.role === "system_admin") {
        router.replace(routes.systemAdminDashboard);
      } else {
        signOut();
        setFormError("Бүртгэл амжилтгүй. Дэмжлэгтэй холбогдоно уу.");
      }
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Бүртгүүлэхэд алдаа гарлаа. Дахин оролдоно уу.";
      setFormError(msg);
    } finally {
      setLoading(false);
    }
  };

  const subtitle = isProviderFlow
    ? "Үйлчилгээ үзүүлэгчээр бүртгүүлж, эмнэлгийн мэдээллээ алхам алхмаар бөглөнө үү."
    : "Үйлчлүүлэгчээр бүртгүүлж, зөвлөгөө болон цаг товлох боломжтой.";

  return (
    <AppContainer centerContent className="flex-1">
      <FormScrollView
        className="flex-1 px-5 pt-6 bg-app-bg"
        contentContainerStyle={webAuthScrollContent({ paddingBottom: 40 })}
      >
      <SectionHeader variant="hero" title="Бүртгүүлэх" subtitle={subtitle} className="mb-2" />

      <EmergencyCallButton className="mb-4" />

      {formError ? <AuthMessageBanner variant="error" message={formError} className="mb-4" /> : null}

      {isProviderFlow ? (
        <View className="mb-4 flex-row gap-1.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <View
              key={s}
              className={cn(
                "h-1.5 flex-1 rounded-full",
                s <= providerStep ? "bg-brand-600 dark:bg-brand-500" : "dark:bg-slate-700",
              )}
              accessibilityLabel={`Алхам ${s}`}
            />
          ))}
        </View>
      ) : null}

      <Card className="mb-4 border border-app-border">
        <Text className="text-sm font-semibold text-app-text">Хэрэглэгчийн төрөл</Text>
        <Text className="mt-1 text-xs leading-5 text-app-text-muted">Нэгийг сонгоно уу. Сонголтоо дараа нь өөрчилж болно.</Text>
        <View className="mt-4 flex-row gap-3">
          <Pressable
            className={cn(
              "min-h-[88px] flex-1 items-center justify-center rounded-2xl border-2 px-3 py-3",
              signupRole === "customer"
                ? "border-brand-600 bg-brand-50 dark:border-brand-400 dark:bg-brand-900"
                : "border-slate-200 bg-white border-app-border-strong bg-app-card",
            )}
            onPress={() => {
              setSignupRole("customer");
              setProviderStep(1);
              setFormError(null);
              setErrors({});
            }}
          >
            <Text
              className={cn(
                "text-center text-base font-bold",
                signupRole === "customer" ? "text-slate-900 dark:text-white" : "text-app-text",
              )}
              numberOfLines={2}
            >
              Үйлчлүүлэгч
            </Text>
            <Text
              className={cn(
                "mt-1 text-center text-xs leading-4",
                signupRole === "customer" ? "text-slate-600 dark:text-brand-100" : "text-app-text-muted",
              )}
              numberOfLines={3}
            >
              Зөвлөгөө, цаг товлох
            </Text>
          </Pressable>
          <Pressable
            className={cn(
              "min-h-[88px] flex-1 items-center justify-center rounded-2xl border-2 px-3 py-3",
              signupRole === "provider"
                ? "border-brand-600 bg-brand-50 dark:border-brand-400 dark:bg-brand-900"
                : "border-slate-200 bg-white border-app-border-strong bg-app-card",
            )}
            onPress={() => {
              setSignupRole("provider");
              setProviderStep(1);
              setFormError(null);
              setErrors({});
            }}
          >
            <Text
              className={cn(
                "text-center text-base font-bold",
                signupRole === "provider" ? "text-slate-900 dark:text-white" : "text-app-text",
              )}
              numberOfLines={2}
            >
              Үйлчилгээ үзүүлэгч
            </Text>
            <Text
              className={cn(
                "mt-1 text-center text-xs leading-4",
                signupRole === "provider" ? "text-slate-600 dark:text-brand-100" : "text-app-text-muted",
              )}
              numberOfLines={3}
            >
              Эмнэлэг, эмч, хуваарь
            </Text>
          </Pressable>
        </View>
      </Card>

      <Card className="border-2 border-slate-200 shadow-md border-app-border-strong">
        {isProviderFlow ? (
          <View className="mb-5 border-b border-slate-200 pb-4 border-app-border">
            <Text className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              Алхам {providerStep} / 5
            </Text>
            <Text className="mt-1 text-base font-semibold text-app-text">{providerStepTitles[providerStep - 1]}</Text>
          </View>
        ) : (
          <Text className="mb-5 text-xs font-bold uppercase tracking-wider text-app-text-muted">
            Хувийн мэдээлэл
          </Text>
        )}

        {(!isProviderFlow || providerStep === 1) && (
          <>
            <Input appearance="prominent"
              label={isProviderFlow ? "Хариуцсан хүний овог нэр" : "Овог нэр"}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Жишээ: Батбаяр Дорж"
              autoComplete="name"
              textContentType="name"
              error={errors.fullName}
              className="min-h-[52px] py-4"
            />
            <Input appearance="prominent"
              label="Имэйл"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              value={email}
              onChangeText={setEmail}
              placeholder="нэр@имэйл.mn"
              error={errors.email}
              hint="Нэвтрэх, мэдэгдэл хүлээн авахад ашиглагдана."
              className="min-h-[52px] py-4"
            />
            <Input appearance="prominent"
              label="Утас"
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              value={phone}
              onChangeText={setPhone}
              placeholder="99112233"
              error={errors.phone}
              hint="8–15 оронтой дугаар. Зөвхөн тоо оруулна уу."
              className="min-h-[52px] py-4"
            />
            <Input appearance="prominent"
              label="Нууц үг"
              secureTextEntry
              textContentType="newPassword"
              value={password}
              onChangeText={setPassword}
              placeholder="Дор хаяж 4 тэмдэгт"
              error={errors.password}
              className="min-h-[52px] py-4"
            />
            <Input appearance="prominent"
              label="Нууц үг давтах"
              secureTextEntry
              textContentType="newPassword"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Дахин оруулна уу"
              error={errors.confirmPassword}
              className="min-h-[52px] py-4"
            />
          </>
        )}

        {isProviderFlow && providerStep === 2 && (
          <>
            <Input appearance="prominent"
              label="Эмнэлгийн нэр"
              value={clinicName}
              onChangeText={setClinicName}
              placeholder="Жишээ: Энэрэл эмнэлэг"
              error={errors.clinicName}
              className="min-h-[52px] py-4"
            />
            <Input appearance="prominent"
              label="Регистр / тусгай зөвшөөрлийн дугаар"
              value={clinicRegistrationNumber}
              onChangeText={setClinicRegistrationNumber}
              placeholder="Жишээ: 12-3456, АБ12345678"
              error={errors.clinicRegistrationNumber}
              className="min-h-[52px] py-4"
            />
            <Text className="mb-2 text-sm font-semibold text-app-text">Төрөл</Text>
            <View className="mb-4 flex-row flex-wrap gap-2">
              {(["эмнэлэг", "төв", "кабинет", "зөвлөгөөний төв"] as const).map((type) => (
                <Pressable
                  key={type}
                  className={cn(
                    "rounded-2xl border-2 px-3 py-2.5",
                    clinicType === type
                      ? "border-brand-600 bg-brand-50 dark:border-brand-400 dark:bg-brand-900"
                      : "border-slate-200 bg-white border-app-border-strong bg-app-card",
                  )}
                  onPress={() => setClinicType(type)}
                >
                  <Text className="text-sm font-medium text-app-text">{type}</Text>
                </Pressable>
              ))}
            </View>
            <Input appearance="prominent"
              label="Танилцуулга"
              value={clinicIntro}
              onChangeText={setClinicIntro}
              placeholder="Ямар үйлчилгээ үзүүлдэг, онцлогууд"
              multiline
              error={errors.clinicIntro}
            />
            <ClinicLogoPickerField value={clinicLogoDataUrl} onChange={setClinicLogoDataUrl} />
          </>
        )}

        {isProviderFlow && providerStep === 3 && (
          <>
            <Input appearance="prominent"
              label="Хаяг"
              value={contactAddress}
              onChangeText={setContactAddress}
              placeholder="Дүүрэг, хороо, байр, давхар"
              error={errors.contactAddress}
              className="min-h-[52px] py-4"
            />
            <Input appearance="prominent"
              label="Утас (эмнэлэг)"
              value={contactPhone}
              onChangeText={setContactPhone}
              keyboardType="phone-pad"
              placeholder="70001212"
              error={errors.contactPhone}
              className="min-h-[52px] py-4"
            />
            <Input appearance="prominent"
              label="Имэйл (эмнэлэг)"
              value={contactEmail}
              onChangeText={setContactEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="холбоо@эмнэлэг.mn"
              error={errors.contactEmail}
              className="min-h-[52px] py-4"
            />
            <Input appearance="prominent"
              label="Ажиллах цаг"
              value={workingHours}
              onChangeText={setWorkingHours}
              placeholder="Даваа–Баасан 09:00–18:00"
              error={errors.workingHours}
              className="min-h-[52px] py-4"
            />
            <Input appearance="prominent"
              label="Хот / дүүрэг"
              value={cityDistrict}
              onChangeText={setCityDistrict}
              placeholder="Улаанбаатар, Сүхбаатар дүүрэг"
              error={errors.cityDistrict}
              className="min-h-[52px] py-4"
            />
          </>
        )}

        {isProviderFlow && providerStep === 4 && (
          <>
            <Input appearance="prominent"
              label="Үзлэгийн чиглэлүүд"
              value={serviceDirections}
              onChangeText={setServiceDirections}
              placeholder="Жишээ: Дотор, зүрх судас, хүүхэд…"
              multiline
              error={errors.serviceDirections}
            />
            <Text className="mb-2 text-sm font-semibold text-app-text">Үйлчилгээний хэлбэр</Text>
            <View className="mb-2 gap-2">
              <Pressable
                className={cn(
                  "rounded-2xl border-2 px-4 py-3",
                  hasOnlineConsult
                    ? "border-brand-600 bg-brand-50 dark:border-brand-400 dark:bg-brand-900"
                    : "border-slate-200 bg-white border-app-border-strong bg-app-card",
                )}
                onPress={() => setHasOnlineConsult((prev) => !prev)}
              >
                <Text className="text-sm font-medium text-app-text">Онлайн зөвлөгөө өгдөг</Text>
              </Pressable>
              <Pressable
                className={cn(
                  "rounded-2xl border-2 px-4 py-3",
                  hasAmbulatoryCare
                    ? "border-brand-600 bg-brand-50 dark:border-brand-400 dark:bg-brand-900"
                    : "border-slate-200 bg-white border-app-border-strong bg-app-card",
                )}
                onPress={() => setHasAmbulatoryCare((prev) => !prev)}
              >
                <Text className="text-sm font-medium text-app-text">Амбулаторийн үзлэг хийдэг</Text>
              </Pressable>
            </View>
            {errors.serviceModes ? <Text className="mb-3 text-sm text-red-600 dark:text-red-400">{errors.serviceModes}</Text> : null}
          </>
        )}

        {isProviderFlow && providerStep === 5 && (
          <View className="gap-3">
            <View className="rounded-2xl border p-4 border-app-border-strong bg-app-muted/60">
              <Text className="text-sm font-semibold text-app-text">Илгээх мэдээллийн тойм</Text>
              <Text className="mt-2 text-xs leading-5 text-app-text-secondary">Хариуцсан хүн: {fullName || "—"}</Text>
              <Text className="mt-1 text-xs leading-5 text-app-text-secondary">
                Эмнэлэг: {clinicName || "—"} ({clinicType})
              </Text>
              <Text className="mt-1 text-xs leading-5 text-app-text-secondary">Регистр/ТЗ: {clinicRegistrationNumber || "—"}</Text>
              <Text className="mt-1 text-xs leading-5 text-app-text-secondary">Байршил: {cityDistrict || "—"}</Text>
              <Text className="mt-1 text-xs leading-5 text-app-text-secondary">Чиглэл: {serviceDirections || "—"}</Text>
              <Text className="mt-1 text-xs leading-5 text-app-text-secondary">
                Лого: {clinicLogoDataUrl ? "Сонгогдсон" : "—"}
              </Text>
            </View>
            <AuthMessageBanner
              variant="info"
              message="Илгээсний дараа бүртгэл системийн админаар шалгагдана. Баталгаажсаны дараа самбар бүрэн нээгдэнэ."
            />
          </View>
        )}

        <View className="mt-2 gap-2 border-t border-slate-200 pt-5 border-app-border">
          {isProviderFlow && providerStep > 1 ? (
            <Button
              label="Өмнөх алхам"
              variant="outline"
              onPress={() => {
                setProviderStep((prev) => Math.max(prev - 1, 1));
                setErrors({});
                setFormError(null);
              }}
            />
          ) : null}
          <Button
            label={isProviderFlow ? (providerStep === 5 ? "Бүртгэл илгээх" : "Дараах алхам") : "Бүртгэл үүсгэх"}
            loading={loading}
            onPress={onRegister}
            className="shadow-sm"
          />
        </View>

        <Link href={routes.login} asChild>
          <Pressable className="mt-5 items-center py-2 active:opacity-80">
            <Text className="text-center text-sm font-medium text-app-text-muted">Бүртгэлтэй юу? Нэвтрэх</Text>
          </Pressable>
        </Link>
      </Card>
      </FormScrollView>
    </AppContainer>
  );
}
