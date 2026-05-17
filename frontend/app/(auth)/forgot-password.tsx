import { AuthMessageBanner, Button, Card, FormScrollView, Input, SectionHeader } from "@/components";
import { routes } from "@/constants/appRoutes";
import { forgotPasswordRequest } from "@/services/api/authApi";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

export default function ForgotPasswordScreen() {
  const [identifier, setIdentifier] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>(undefined);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    const value = identifier.trim();
    if (!value) {
      setFieldError("Имэйл хаяг эсвэл утасны дугаараа оруулна уу.");
      setFormError(null);
      return;
    }
    setFieldError(undefined);
    setFormError(null);
    setLoading(true);
    try {
      const res = await forgotPasswordRequest(value);
      if (res.reset_token?.trim()) {
        router.replace({
          pathname: "/reset-password",
          params: { token: res.reset_token.trim() },
        });
        return;
      }
      router.replace({
        pathname: "/reset-password-success",
        params: { target: value },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Хүсэлт илгээхэд алдаа гарлаа. Сүлжээ, хаягаа шалгаад дахин оролдоно уу.";
      setFormError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormScrollView className="flex-1 bg-slate-50 px-5 pt-6 dark:bg-slate-950" contentContainerStyle={{ paddingBottom: 40 }}>
      <SectionHeader
        variant="hero"
        title="Нууц үг мартсан"
        subtitle="Бүртгэлтэй имэйл эсвэл утасны дугаараа оруулбал сэргээх зааврыг илгээнэ."
        className="mb-2"
      />

      {formError ? <AuthMessageBanner variant="error" message={formError} className="mb-4" /> : null}

      <Card className="border-2 border-slate-200 shadow-md dark:border-slate-600">
        <View className="mb-5 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/40">
          <Input
            label="Имэйл эсвэл утас"
            appearance="prominent"
            value={identifier}
            onChangeText={(t) => {
              setIdentifier(t);
              if (fieldError) setFieldError(undefined);
              if (formError) setFormError(null);
            }}
            autoCapitalize="none"
            autoComplete="username"
            textContentType="username"
            placeholder="жишээ@имэйл.mn эсвэл 99112233"
            error={fieldError}
            hint="Бүртгэлд бүртгэсэн хаяг эсвэл утасны дугаараа оруулна уу."
            className="min-h-[52px] border-slate-200 bg-white py-4 dark:border-slate-600 dark:bg-slate-900"
          />
        </View>

        <View className="mb-6 rounded-2xl bg-slate-100 px-4 py-3.5 dark:bg-slate-800/90">
          <Text className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">Санамж</Text>
          <Text className="mt-2 text-sm leading-5 text-slate-600 dark:text-slate-400">
            Заавар имэйл эсвэл мессежээр ирнэ. Хэдэн минут хүлээгээд «Спам» хавтсаа шалгана уу.
          </Text>
        </View>

        <Button label="Сэргээх заавар авах" loading={loading} onPress={onSubmit} className="min-h-[54px] shadow-md" />

        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace(routes.login)}
          className="mt-4 items-center py-3 active:opacity-80"
        >
          <Text className="text-center text-sm font-medium text-slate-600 dark:text-slate-400">Нэвтрэх хуудас руу буцах</Text>
        </Pressable>
      </Card>
    </FormScrollView>
  );
}
