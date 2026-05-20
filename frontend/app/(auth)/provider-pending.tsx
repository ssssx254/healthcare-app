import { AuthMessageBanner, Button, Card, FormScrollView, SectionHeader } from "@/components";
import { routes } from "@/constants/appRoutes";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";
import { Redirect, router } from "expo-router";
import { Text, View } from "react-native";

export default function ProviderPendingScreen() {
  const { user, isAuthenticated, signOut, authLoading } = useAuth();

  if (authLoading) return null;
  if (!isAuthenticated) {
    return <Redirect href={routes.login} />;
  }
  if (user?.role === "customer") {
    return <Redirect href={routes.customerHome} />;
  }
  if (user?.role === "system_admin") {
    return <Redirect href={routes.systemAdminDashboard} />;
  }
  if (user?.role !== "provider") {
    return <Redirect href={routes.login} />;
  }
  if (user.approvalStatus === "approved") {
    return <Redirect href={routes.providerDashboard} />;
  }

  const isRejected = user.approvalStatus === "rejected";

  return (
    <FormScrollView className="flex-1 px-5 pt-6 bg-app-bg" contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="mb-4 items-center">
        <View
          className={`h-16 w-16 items-center justify-center rounded-2xl ${
            isRejected ? "bg-rose-100 dark:bg-rose-900/40" : "bg-amber-100 dark:bg-amber-900/40"
          }`}
        >
          <MaterialCommunityIcons
            name={isRejected ? "close-circle-outline" : "clock-outline"}
            size={36}
            color={isRejected ? "#e11d48" : "#d97706"}
          />
        </View>
      </View>
      <SectionHeader
        variant="hero"
        title={isRejected ? "Бүртгэл татгалзагдсан" : "Бүртгэл шалгалтад байна"}
        subtitle={
          isRejected
            ? "Таны үйлчилгээ үзүүлэгчийн бүртгэлийг админ татгалзсан. Дэмжлэгтэй холбогдож эсвэл шинээр бүртгүүлнэ үү."
            : "Таны эмнэлгийн мэдээллийг системийн админ хянаж, баталгаажуулна."
        }
        className="mb-2"
      />

      <AuthMessageBanner
        variant="info"
        message={
          isRejected
            ? "Шалтгаан эсвэл дараагийн алхмуудын талаар имэйл эсвэл дэмжлэгийн сувгаар мэдэгдэл авна уу."
            : "Бүртгэл баталгаажсаны дараа үйлчилгээ үзүүлэгчийн самбар бүрэн нээгдэнэ. Энэ хугацаанд түр хүлээнэ үү."
        }
        className="mb-4"
      />

      <Card className="border-2 border-slate-200 shadow-md border-app-border-strong">
        <Text className="text-sm leading-6 text-app-text-secondary">
          Илгээсэн мэдээллийг шинэчлэх шаардлагатай бол дэмжлэгтэй холбогдож эсвэл дахин нэвтэрч шалгана уу.
        </Text>
        <Button label="Нэвтрэх хуудас руу" className="mt-6 shadow-sm" onPress={() => router.replace(routes.login)} />
        <Button
          label="Гарах"
          variant="outline"
          className="mt-3"
          onPress={() => {
            signOut();
            router.replace(routes.login);
          }}
        />
      </Card>
    </FormScrollView>
  );
}
