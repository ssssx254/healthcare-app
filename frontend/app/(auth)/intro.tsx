import {
  AppIcon,
  AuthScreenThemeToggle,
  Button,
  Card,
  EmergencyCallButton,
  FormScrollView,
  SectionHeader,
} from "@/components";
import { copy } from "@/constants/copy";
import { routes } from "@/constants/appRoutes";
import { authHeaderlessScrollContent } from "@/utils/authScrollContent";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function IntroScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-app-bg">
      <AuthScreenThemeToggle />
      <FormScrollView
        className="flex-1"
        contentContainerStyle={authHeaderlessScrollContent(insets.top)}
      >
      <SectionHeader
        variant="hero"
        title="Танилцуулга"
        subtitle={copy.common.tagline}
        className="mb-2"
      />

      <EmergencyCallButton className="mb-4" />

      <Card className="mb-4 border shadow-sm border-app-border">
        <View className="flex-row gap-4">
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 dark:bg-brand-900/50">
            <AppIcon name="account-heart-outline" size={26} color="#2563eb" />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-base font-bold text-app-text">Үйлчлүүлэгчид</Text>
            <Text className="mt-2 text-sm leading-6 text-app-text-secondary">
              Үнэгүй онлайн зөвлөгөө авах, мөн төлбөртэй албан ёсны цаг товлож эмчид хүрэх боломжтой. Бүх зүйл нэг аппаас.
            </Text>
          </View>
        </View>
      </Card>

      <Card className="mb-6 border shadow-sm border-app-border">
        <View className="flex-row gap-4">
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/40">
            <AppIcon name="hospital-building" size={26} color="#059669" />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-base font-bold text-app-text">Үйлчилгээ үзүүлэгчид</Text>
            <Text className="mt-2 text-sm leading-6 text-app-text-secondary">
              Эмнэлэг, клиник платформд бүртгүүлж эмч нэмэх, хуваарь удирдах, захиалга хүлээн авахад зориулсан хэрэгсэл.
            </Text>
          </View>
        </View>
      </Card>

      <Button label="Нэвтрэх" className="shadow-sm" onPress={() => router.push(routes.login)} />
      <Button
        label="Шинээр бүртгүүлэх"
        variant="outline"
        className="mt-3"
        onPress={() => router.push(routes.register)}
      />

      <Pressable
        accessibilityRole="link"
        className="mt-5 items-center py-2 active:opacity-80"
        accessibilityLabel="Нууц үг мартсан, сэргээх"
        onPress={() => router.push("/forgot-password")}
      >
        <Text className="text-center text-sm font-semibold text-brand-600 underline dark:text-brand-400">Нууц үг мартсан уу?</Text>
      </Pressable>
      </FormScrollView>
    </View>
  );
}
