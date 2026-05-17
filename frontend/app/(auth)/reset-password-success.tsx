import { AuthMessageBanner, Button, Card, FormScrollView, SectionHeader } from "@/components";
import { routes } from "@/constants/appRoutes";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Link, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

export default function ResetPasswordSuccessScreen() {
  const params = useLocalSearchParams<{ target?: string }>();
  const target = typeof params.target === "string" ? params.target : "";

  const detail = target
    ? `«${target}» хаяг руу нууц үг сэргээх заавар илгээгдлээ. Имэйл эсвэл мессежээ шалгаад, зааврын дагуу шинэ нууц үг тохируулна уу.`
    : "Нууц үг сэргээх заавар илгээгдлээ. Имэйл эсвэл мессежээ шалгаад, зааврын дагуу шинэ нууц үг тохируулна уу.";

  return (
    <FormScrollView className="flex-1 bg-slate-50 px-5 pt-6 dark:bg-slate-950" contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="mb-4 items-center">
        <View className="h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/40">
          <MaterialCommunityIcons name="email-check-outline" size={36} color="#059669" />
        </View>
      </View>
      <SectionHeader
        variant="hero"
        title="Заавар илгээгдлээ"
        subtitle="Дараагийн алхмуудыг гүйцэтгээд дахин нэвтэрнэ үү."
        className="mb-2"
      />

      <AuthMessageBanner
        variant="success"
        message="Хүсэлт амжилттай хүлээн авлаа. Мэдэгдэл ирэхгүй бол имэйлийн «Спам» хавтсыг шалгана уу. Хэрэв токен аваагүй бол «Нэвтрэх» дээрх «Токеноор солих»-оор оруулна уу."
        className="mb-4"
      />

      <Card className="border-2 border-slate-200 shadow-md dark:border-slate-600">
        <Text className="text-sm leading-6 text-slate-700 dark:text-slate-300">{detail}</Text>
        <Link href={routes.login} asChild>
          <Button label="Нэвтрэх хуудас руу" className="mt-6 shadow-sm" />
        </Link>
      </Card>
    </FormScrollView>
  );
}
