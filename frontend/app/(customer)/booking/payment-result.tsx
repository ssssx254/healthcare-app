import { AuthMessageBanner, Button, Card, FormScrollView, SectionHeader } from "@/components";
import { formatMnt } from "@/lib/formatMnt";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Link, Stack, useLocalSearchParams, router } from "expo-router";
import { Text, View } from "react-native";

export default function PaymentResultScreen() {
  const { kind, status, amount, message, channel, orderId, method } = useLocalSearchParams<{
    kind?: string;
    status?: string;
    amount?: string;
    message?: string;
    channel?: string;
    orderId?: string;
    method?: string;
  }>();
  const ok = status === "success";
  const amt = amount ? Number(amount) : NaN;

  const title = ok
    ? kind === "topup"
      ? "Цэнэглэлт амжилттай"
      : "Төлбөр амжилттай"
    : kind === "topup"
      ? "Цэнэглэлт амжилтгүй"
      : "Төлбөр амжилтгүй";

  const subtitle = ok
    ? channel === "qpay"
      ? "КьюПэй-ийн жишээ урсгалаар данс шинэчлэгдлээ."
      : kind === "topup"
        ? "Таны цахим дансны үлдэгдэл шинэчлэгдсэн."
        : "Захиалгын төлбөр бүртгэгдлээ."
    : typeof message === "string" && message.trim()
      ? message.trim()
      : "Дахин оролдож эсвэл хэтэвчээ шалгана уу.";

  return (
    <>
      <Stack.Screen
        options={{
          title: ok ? "Амжилттай" : "Алдаа",
          gestureEnabled: !ok,
          headerBackVisible: !ok,
        }}
      />
      <FormScrollView className="flex-1 px-5 pt-6 bg-app-bg" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="mb-4 items-center">
          <View
            className={`h-20 w-20 items-center justify-center rounded-3xl ${ok ? "bg-emerald-100 dark:bg-emerald-900/40" : "bg-red-100 dark:bg-red-900/30"}`}
          >
            <MaterialCommunityIcons
              name={ok ? "check-decagram" : "alert-circle-outline"}
              size={48}
              color={ok ? "#059669" : "#dc2626"}
            />
          </View>
        </View>
        <SectionHeader variant="hero" title={title} subtitle={subtitle} className="mb-2" />

        {!ok && message ? <AuthMessageBanner variant="error" message={String(message)} className="mb-4" /> : null}

        {ok && !Number.isNaN(amt) && amt > 0 ? (
          <Card className="mb-4">
            <Text className="text-xs text-app-text-muted">Дүн</Text>
            <Text className="mt-1 text-2xl font-bold text-app-text">{formatMnt(amt)}</Text>
          </Card>
        ) : null}

        {ok && orderId && method ? (
          <Button
            label="Захиалгын төлбөр үргэлжлүүлэх"
            className="mb-3 shadow-sm"
            onPress={() =>
              router.replace({
                pathname: "/booking/account-info",
                params: { orderId, method },
              })
            }
          />
        ) : null}

        {ok ? (
          <>
            <Link href="/(customer)/wallet" asChild>
              <Button label="Хэтэвч харах" className="shadow-sm" />
            </Link>
            <Link href="/(customer)/my-orders" asChild>
              <Button label="Захиалгууд" variant="outline" className="mt-3" />
            </Link>
          </>
        ) : (
          <>
            {orderId ? (
              <Button
                label="Төлбөр дахин оролдох"
                className="shadow-sm"
                onPress={() =>
                  router.replace({
                    pathname: "/booking/account-info",
                    params: { orderId, method: "wallet" },
                  })
                }
              />
            ) : (
              <Button label="Буцах" onPress={() => router.back()} className="shadow-sm" />
            )}
            <Link href="/(customer)/wallet" asChild>
              <Button label="Хэтэвч" variant="outline" className="mt-3" />
            </Link>
          </>
        )}
      </FormScrollView>
    </>
  );
}
