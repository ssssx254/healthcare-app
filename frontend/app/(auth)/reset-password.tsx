import { AuthMessageBanner, Button, Card, FormScrollView, Input, SectionHeader } from "@/components";
import { routes } from "@/constants/appRoutes";
import { resetPassword } from "@/services/api/authApi";
import { ApiError } from "@/lib/api/client";
import { Link, router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ token?: string }>();
  const initialToken = typeof params.token === "string" ? params.token : "";

  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    token?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialToken.trim()) setToken(initialToken.trim());
  }, [initialToken]);

  const onSubmit = async () => {
    const next: typeof fieldErrors = {};
    const t = token.trim();
    const p = newPassword.trim();
    const c = confirmPassword.trim();

    if (!t) next.token = "Сэргээх токен оруулна уу.";
    if (!p) next.newPassword = "Шинэ нууц үгээ оруулна уу.";
    else if (p.length < 4) next.newPassword = "Нууц үг хамгийн багадаа 4 тэмдэгт байна.";
    else if (p.length > 72) next.newPassword = "Нууц үг хамгийн ихдээ 72 тэмдэгт байна.";
    if (!c) next.confirmPassword = "Нууц үгээ давтан оруулна уу.";
    else if (p && c !== p) next.confirmPassword = "Нууц үг таарахгүй байна.";

    setFieldErrors(next);
    if (Object.keys(next).length > 0) {
      setFormError(null);
      return;
    }

    setFormError(null);
    setLoading(true);
    try {
      await resetPassword({ token: t, newPassword: p });
      router.replace(routes.login);
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Шинэчлэхэд алдаа гарлаа. Дахин оролдоно уу.";
      setFormError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormScrollView className="flex-1 px-5 pt-6 bg-app-bg" contentContainerStyle={{ paddingBottom: 40 }}>
      <SectionHeader
        variant="hero"
        title="Нууц үг шинэчлэх"
        subtitle="Сэргээх токен болон шинэ нууц үгээ оруулна. Токеныг имэйл эсвэл өмнөх алхмаас авна."
        className="mb-2"
      />

      {formError ? <AuthMessageBanner variant="error" message={formError} className="mb-4" /> : null}

      <Card className="border-2 border-slate-200 shadow-md border-app-border-strong">
        <View className="mb-5 rounded-2xl p-4 bg-app-muted/40">
          <Input
            label="Сэргээх токен"
            appearance="prominent"
            value={token}
            onChangeText={(v) => {
              setToken(v);
              if (fieldErrors.token) setFieldErrors((e) => ({ ...e, token: undefined }));
              if (formError) setFormError(null);
            }}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="JWT токен"
            error={fieldErrors.token}
            hint="«Нууц үг мартсан»-аас ирсэн бол автоматаар бөглөгдөнө."
            className="min-h-[52px] border-slate-200 bg-white py-4 border-app-border-strong bg-app-card"
          />
          <Input
            label="Шинэ нууц үг"
            appearance="prominent"
            secureTextEntry
            textContentType="newPassword"
            value={newPassword}
            onChangeText={(v) => {
              setNewPassword(v);
              if (fieldErrors.newPassword) setFieldErrors((e) => ({ ...e, newPassword: undefined }));
              if (formError) setFormError(null);
            }}
            placeholder="4–72 тэмдэгт"
            error={fieldErrors.newPassword}
            className="mt-4 min-h-[52px] border-slate-200 bg-white py-4 border-app-border-strong bg-app-card"
          />
          <Input
            label="Шинэ нууц үг (давтах)"
            appearance="prominent"
            secureTextEntry
            textContentType="newPassword"
            value={confirmPassword}
            onChangeText={(v) => {
              setConfirmPassword(v);
              if (fieldErrors.confirmPassword) setFieldErrors((e) => ({ ...e, confirmPassword: undefined }));
              if (formError) setFormError(null);
            }}
            placeholder="Дахин оруулна уу"
            error={fieldErrors.confirmPassword}
            className="mt-4 min-h-[52px] border-slate-200 bg-white py-4 border-app-border-strong bg-app-card"
          />
        </View>

        <Button label="Хадгалах" loading={loading} onPress={() => void onSubmit()} className="min-h-[54px] shadow-md" />

        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace(routes.login)}
          className="mt-4 items-center py-3 active:opacity-80"
        >
          <Text className="text-center text-sm font-medium text-app-text-muted">Нэвтрэх хуудас руу буцах</Text>
        </Pressable>

        <Link href="/forgot-password" asChild>
          <Pressable accessibilityRole="link" className="items-center py-2 active:opacity-80">
            <Text className="text-center text-sm font-semibold text-brand-600 dark:text-brand-400">Нууц үгээ дахин сэргээх</Text>
          </Pressable>
        </Link>
      </Card>
    </FormScrollView>
  );
}
