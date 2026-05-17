import { Button, Card, FormScrollView, SectionHeader } from "@/components";
import { routes } from "@/constants/appRoutes";
import { formatMnt } from "@/lib/formatMnt";
import { useCustomerBooking } from "@/contexts/CustomerBookingContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Link, Stack, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

export default function BookingSuccessScreen() {
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const { orders } = useCustomerBooking();
  const order = orderId ? orders.find((o) => o.id === orderId) : null;

  return (
    <>
      <Stack.Screen
        options={{
          title: "Амжилттай",
          gestureEnabled: false,
          headerBackVisible: false,
        }}
      />
      <FormScrollView className="flex-1 bg-slate-50 px-5 pt-6 dark:bg-slate-950" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="mb-4 items-center">
          <View className="h-20 w-20 items-center justify-center rounded-3xl bg-emerald-100 dark:bg-emerald-900/40">
            <MaterialCommunityIcons name="calendar-check" size={44} color="#059669" />
          </View>
        </View>
        <SectionHeader
          variant="hero"
          title="Захиалга баталгаажлаа"
          subtitle="Төлбөр бүртгэгдэж, цаг тань системд хадгалагдлаа."
        />
        <Card className="border border-emerald-100 dark:border-emerald-900/40">
          {order ? (
            <>
              <Text className="text-sm font-semibold text-slate-900 dark:text-slate-50">{order.serviceTitle}</Text>
              <Text className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {order.doctorName} · {order.clinicName}
              </Text>
              {order.priceMnt > 0 ? (
                <Text className="mt-3 text-lg font-bold text-slate-900 dark:text-slate-50">{formatMnt(order.priceMnt)}</Text>
              ) : null}
            </>
          ) : (
            <Text className="text-sm leading-6 text-slate-600 dark:text-slate-300">Таны захиалга амжилттай бүртгэгдлээ.</Text>
          )}
          <Text className="mt-4 text-xs leading-5 text-slate-500 dark:text-slate-400">
            Мэдэгдэл, «Миний захиалгууд»-аас төлөвөө дагаж байна уу.
          </Text>
          <Link href={routes.customerMyOrders} asChild>
            <Button label="Миний захиалгууд" className="mt-5 shadow-sm" />
          </Link>
          <Link href={routes.customerHome} asChild>
            <Button label="Нүүр рүү" variant="outline" className="mt-3" />
          </Link>
        </Card>
      </FormScrollView>
    </>
  );
}
