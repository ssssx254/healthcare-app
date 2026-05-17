import type { Notification } from "@/types/healthcare";

export const fixtureCustomerNotifications: Notification[] = [
  {
    id: "cn1",
    titleMn: "Цагийн сануулга",
    bodyMn: "Маргааш 10:00-д эмчийн уулзалт байна.",
    timeLabelMn: "Өнөөдөр 09:12",
    audience: "customer",
    tone: "brand",
  },
  {
    id: "cn2",
    titleMn: "Төлбөр амжилттай",
    bodyMn: "Захиалгын төлбөр баталгаажлаа.",
    timeLabelMn: "Өчигдөр 16:40",
    audience: "customer",
    tone: "success",
  },
  {
    id: "cn3",
    titleMn: "Системийн мэдэгдэл",
    bodyMn: "Үйлчилгээ түр зогссон байж болзошгүй — уучлаарай.",
    timeLabelMn: "2026-04-08",
    audience: "customer",
    tone: "neutral",
  },
];

export const fixtureProviderNotifications: Notification[] = [
  {
    id: "pn1",
    titleMn: "Шинэ захиалгын хүсэлт",
    bodyMn: "Өвчтөн албан ёсны цаг товлох хүсэлт илгээсэн байна.",
    timeLabelMn: "Өнөөдөр 08:45",
    audience: "provider",
    tone: "warning",
  },
  {
    id: "pn2",
    titleMn: "Төлбөр баталгаажлаа",
    bodyMn: "Төлбөртэй захиалгын төлбөр амжилттай төлөгдлөө.",
    timeLabelMn: "Өчигдөр 14:20",
    audience: "provider",
    tone: "success",
  },
  {
    id: "pn3",
    titleMn: "Цагийн сануулга",
    bodyMn: "15 минутын дараа онлайн уулзалт эхэлнэ.",
    timeLabelMn: "2026-04-10",
    audience: "provider",
    tone: "brand",
  },
];
