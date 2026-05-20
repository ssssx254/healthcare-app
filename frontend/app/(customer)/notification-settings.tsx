import { Button, Card, FormScrollView, SectionHeader } from "@/components";
import {
  notifyBookingCancelled,
  notifyBookingConfirmed,
  notifyBookingCreated,
  notifyPaymentSucceeded,
  notifyVisitReminder,
} from "@/lib/notifications/eventNotifications";
import { getExpoPushTokenSafe, requestNotificationPermissionMn } from "@/lib/notifications/expoNotifications";
import { notificationApi } from "@/services/api/notificationApi";
import { Stack } from "expo-router";
import { useState } from "react";
import { Text } from "react-native";

export default function NotificationSettingsScreen() {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onEnable = () => {
    setLoading(true);
    setStatus(null);
    void (async () => {
      try {
        const granted = await requestNotificationPermissionMn();
        if (!granted) {
          setStatus("Мэдэгдлийн зөвшөөрөл олгогдоогүй байна.");
          return;
        }
        const token = await getExpoPushTokenSafe();
        if (!token) {
          setStatus("Push token авч чадсангүй. Expo Go дээр дахин оролдоно уу.");
          return;
        }
        try {
          await notificationApi.registerPushToken(token);
          setStatus("Push token амжилттай бүртгэгдлээ.");
        } catch {
          setStatus("Push token үүссэн. Серверийн тохиргоо бэлэн болмогц хадгалагдана.");
        }
      } finally {
        setLoading(false);
      }
    })();
  };

  return (
    <>
      <Stack.Screen options={{ title: "Мэдэгдлийн тохиргоо" }} />
      <FormScrollView className="flex-1 bg-app-bg" contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
        <SectionHeader title="Мэдэгдлийн тохиргоо" subtitle="Push зөвшөөрөл болон туршилтын мэдэгдэл." />
        <Card className="mb-3">
          <Button label="Мэдэгдлийн зөвшөөрөл авах" loading={loading} onPress={onEnable} />
          {status ? <Text className="mt-2 text-xs text-app-text-secondary">{status}</Text> : null}
        </Card>
        <Card>
          <Text className="mb-2 text-sm font-semibold text-app-text">Туршилтын мэдэгдэл</Text>
          <Button label="Захиалга үүссэн" variant="outline" className="mb-2" onPress={() => void notifyBookingCreated()} />
          <Button label="Захиалга баталгаажсан" variant="outline" className="mb-2" onPress={() => void notifyBookingConfirmed()} />
          <Button label="Захиалга цуцлагдсан" variant="outline" className="mb-2" onPress={() => void notifyBookingCancelled()} />
          <Button label="Төлбөр амжилттай" variant="outline" className="mb-2" onPress={() => void notifyPaymentSucceeded()} />
          <Button label="Үзлэгийн сануулга" variant="outline" onPress={() => void notifyVisitReminder()} />
        </Card>
      </FormScrollView>
    </>
  );
}

