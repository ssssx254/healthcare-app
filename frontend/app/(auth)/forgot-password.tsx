import {
  AuthMessageBanner,
  Button,
  Card,
  EmergencyCallButton,
  FormScrollView,
  Input,
  SectionHeader,
} from "@/components";
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
    <FormScrollView className="flex-1 px-5 pt-6 bg-app-bg" contentContainerStyle={{ paddingBottom: 40 }}>
      <SectionHeader
        variant="hero"
        title="Нууц үг мартсан"
        subtitle="Бүртгэлтэй имэйл эсвэл утасны дугаараа оруулбал сэргээх зааврыг илгээнэ."
        className="mb-2"
      />

      <EmergencyCallButton className="mb-4" />

      {formError ? <AuthMessageBanner variant="error" message={formError} className="mb-4" /> : null}

      <Card className="border-2 border-app-border-strong shadow-md">
        <View className="mb-5 rounded-2xl p-4 bg-app-muted/40">
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
            className="min-h-[52px] py-4"
          />
        </View>

        <View className="mb-6 rounded-2xl px-4 py-3.5 bg-app-muted/90">
          <Text className="text-xs font-bold uppercase tracking-wide text-app-text-secondary">Санамж</Text>
          <Text className="mt-2 text-sm leading-5 text-app-text-muted">
            Заавар имэйл эсвэл мессежээр ирнэ. Хэдэн минут хүлээгээд «Спам» хавтсаа шалгана уу.
          </Text>
        </View>

        <Button label="Сэргээх заавар авах" loading={loading} onPress={onSubmit} className="min-h-[54px] shadow-md" />

        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace(routes.login)}
          className="mt-4 items-center py-3 active:opacity-80"
        >
          <Text className="text-center text-sm font-medium text-app-text-muted">Нэвтрэх хуудас руу буцах</Text>
        </Pressable>
      </Card>
    </FormScrollView>
  );
}
