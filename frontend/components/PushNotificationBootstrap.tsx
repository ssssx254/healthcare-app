import { useAuth } from "@/hooks/useAuth";
import { getExpoPushTokenSafe, requestNotificationPermissionMn } from "@/lib/notifications/expoNotifications";
import { notificationApi } from "@/services/api/notificationApi";
import { useEffect } from "react";

export function PushNotificationBootstrap() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    void (async () => {
      const granted = await requestNotificationPermissionMn();
      if (!active || !granted) return;
      const expoToken = await getExpoPushTokenSafe();
      if (!active || !expoToken) return;
      try {
        await notificationApi.registerPushToken(expoToken);
      } catch {
        // Backend endpoint бэлэн биш үед алгасна.
      }
    })();
    return () => {
      active = false;
    };
  }, [user?.id]);

  return null;
}

