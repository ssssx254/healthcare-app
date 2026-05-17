import { AppIcon, Button, Card, FormScrollView, SectionHeader } from "@/components";
import { copy } from "@/constants/copy";
import { routes } from "@/constants/appRoutes";
import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function IntroScreen() {
  return (
    <FormScrollView
      className="flex-1 bg-slate-50 dark:bg-slate-950"
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 36 }}
    >
      <SectionHeader
        variant="hero"
        title="Танилцуулга"
        subtitle={copy.common.tagline}
        className="mb-2"
      />

      <Card className="mb-4 border border-slate-200 shadow-sm dark:border-slate-700">
        <View className="flex-row gap-4">
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 dark:bg-brand-900/50">
            <AppIcon name="account-heart-outline" size={26} color="#2563eb" />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-base font-bold text-slate-900 dark:text-slate-50">Үйлчлүүлэгчид</Text>
            <Text className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Үнэгүй онлайн зөвлөгөө авах, мөн төлбөртэй албан ёсны цаг товлож эмчид хүрэх боломжтой. Бүх зүйл нэг аппаас.
            </Text>
          </View>
        </View>
      </Card>

      <Card className="mb-6 border border-slate-200 shadow-sm dark:border-slate-700">
        <View className="flex-row gap-4">
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/40">
            <AppIcon name="hospital-building" size={26} color="#059669" />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-base font-bold text-slate-900 dark:text-slate-50">Үйлчилгээ үзүүлэгчид</Text>
            <Text className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Эмнэлэг, клиник платформд бүртгүүлж эмч нэмэх, хуваарь удирдах, захиалга хүлээн авахад зориулсан хэрэгсэл.
            </Text>
          </View>
        </View>
      </Card>

      <Link href={routes.login} asChild>
        <Button label="Нэвтрэх" className="shadow-sm" />
      </Link>
      <Link href={routes.register} asChild>
        <Button label="Шинээр бүртгүүлэх" variant="outline" className="mt-3" />
      </Link>

      <Link href="/forgot-password" asChild>
        <Pressable
          accessibilityRole="link"
          className="mt-5 items-center py-2 active:opacity-80"
          accessibilityLabel="Нууц үг мартсан, сэргээх"
        >
          <Text className="text-center text-sm font-semibold text-brand-600 underline dark:text-brand-400">Нууц үг мартсан уу?</Text>
        </Pressable>
      </Link>
    </FormScrollView>
  );
}
