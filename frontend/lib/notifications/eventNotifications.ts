import { scheduleLocalDemoNotification } from "@/lib/notifications/expoNotifications";

export async function notifyBookingCreated(): Promise<void> {
  await scheduleLocalDemoNotification("Захиалга үүссэн", "Таны захиалга амжилттай үүслээ.");
}

export async function notifyBookingConfirmed(): Promise<void> {
  await scheduleLocalDemoNotification("Захиалга баталгаажсан", "Таны захиалгыг үзүүлэгч баталгаажууллаа.");
}

export async function notifyBookingCancelled(): Promise<void> {
  await scheduleLocalDemoNotification("Захиалга цуцлагдсан", "Таны захиалга цуцлагдлаа.");
}

export async function notifyPaymentSucceeded(): Promise<void> {
  await scheduleLocalDemoNotification("Төлбөр амжилттай", "Төлбөр амжилттай бүртгэгдлээ.");
}

export async function notifyVisitReminder(): Promise<void> {
  await scheduleLocalDemoNotification("Үзлэгийн сануулга", "Таны үзлэгийн цаг ойртож байна.", 2);
}

