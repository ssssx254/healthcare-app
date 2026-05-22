import {
  AppContainer,
  AuthMessageBanner,
  Button,
  Card,
  EmergencyCallButton,
  FormScrollView,
  Input,
  SectionHeader,
} from "@/components";
import { webAuthScrollContent } from "@/utils/webScrollContent";
import { routes } from "@/constants/appRoutes";
import { useAuth } from "@/hooks/useAuth";
import { ApiError } from "@/lib/api/client";
import { Link, router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

function emailValid(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function LoginScreen() {
  const { signIn, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const onLogin = async () => {
    const nextErrors: { email?: string; password?: string } = {};
    const normalized = email.trim();

    if (!normalized) nextErrors.email = "Имэйл хаягаа оруулна уу.";
    else if (!emailValid(normalized)) nextErrors.email = "Имэйл хаягийн формат буруу байна.";

    if (!password.trim()) nextErrors.password = "Нууц үгээ оруулна уу.";
    else if (password.trim().length < 4) nextErrors.password = "Нууц үг дор хаяж 4 тэмдэгт байх ёстой.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setFormError(null);
    try {
      setLoading(true);
      const user = await signIn({ email: normalized, password: password.trim() });
      if (user.role === "customer") {
        router.replace(routes.customerHome);
      } else if (user.role === "provider") {
        router.replace(routes.providerDashboard);
      } else if (user.role === "system_admin") {
        router.replace(routes.systemAdminDashboard);
      } else {
        signOut();
        setFormError("Энэ төрлийн бүртгэлийг дэмжихгүй байна. Дэмжлэгтэй холбогдоно уу.");
      }
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Нэвтрэхэд алдаа гарлаа. Дахин оролдоно уу.";
      setFormError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppContainer centerContent className="flex-1">
      <FormScrollView
        className="flex-1 px-5 pt-6 bg-app-bg"
        contentContainerStyle={webAuthScrollContent({ paddingBottom: 40 })}
      >
      <SectionHeader
        variant="hero"
        title="Нэвтрэх"
        subtitle="Бүртгэлтэй имэйл болон нууц үгээр нэвтэрч үргэлжлүүлнэ үү."
        className="mb-2"
      />

      <EmergencyCallButton className="mb-4" />

      {formError ? <AuthMessageBanner variant="error" message={formError} className="mb-5" /> : null}

      <Card className="border-2 border-app-border-strong shadow-md">
        <Text className="mb-5 text-xs font-bold uppercase tracking-wider text-app-text-muted">
          Нэвтрэх мэдээлэл
        </Text>

        <View className="mb-1 rounded-2xl p-4 bg-app-muted/40">
          <Input
            label="Имэйл"
            appearance="prominent"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              if (formError) setFormError(null);
              if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
            }}
            placeholder="нэр@имэйл.mn"
            error={errors.email}
            hint="Бүртгэлтэй имэйл хаягаа оруулна уу."
            className="min-h-[52px] py-4"
          />
          <Input
            label="Нууц үг"
            appearance="prominent"
            secureTextEntry
            textContentType="password"
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              if (formError) setFormError(null);
              if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
            }}
            placeholder="Нууц үгээ оруулна уу"
            error={errors.password}
            hint="Түлхүүр үгээ нууцлан хадгална уу."
            className="min-h-[52px] py-4"
          />
        </View>

        <View className="mb-5 mt-2 flex-row flex-wrap items-center justify-end gap-x-4 gap-y-2">
          <Link href="/forgot-password" asChild>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Нууц үг мартсан, сэргээх хуудас руу"
              className="rounded-lg py-2 active:opacity-80"
              hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
            >
              <Text className="text-base font-semibold text-brand-600 underline dark:text-brand-400">Нууц үг мартсан уу?</Text>
            </Pressable>
          </Link>
          <Link href="/reset-password" asChild>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Токеноор нууц үг солих"
              className="rounded-lg py-2 active:opacity-80"
              hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
            >
              <Text className="text-sm font-semibold text-slate-600 underline text-app-text-muted">Токеноор солих</Text>
            </Pressable>
          </Link>
        </View>

        <Button label="Нэвтрэх" loading={loading} onPress={onLogin} className="min-h-[54px] shadow-md" />

        <View className="mt-8 border-t border-app-border pt-6">
          <Link href={routes.register} asChild>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Бүртгүүлэх хуудас руу"
              className="items-center py-2 active:opacity-80"
            >
              <Text className="text-center text-base font-semibold text-brand-600 underline dark:text-brand-400">Бүртгүүлэх</Text>
            </Pressable>
          </Link>
        </View>
      </Card>
      </FormScrollView>
    </AppContainer>
  );
}
