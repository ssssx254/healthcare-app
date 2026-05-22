import type { ComponentProps } from "react";
import type { MaterialCommunityIcons } from "@expo/vector-icons";

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

/** Үйлчилгээний ангиллын нэрээс тохирох жижиг icon сонгоно. */
export function iconForServiceCategoryName(name: string): IconName {
  const n = name.trim().toLowerCase();
  if (n.includes("зүрх") || n.includes("судас") || n.includes("cardio")) return "heart-pulse";
  if (n.includes("хүүхэд") || n.includes("ped")) return "baby-face-outline";
  if (n.includes("дотор") || n.includes("гастро")) return "stomach";
  if (n.includes("онош") || n.includes("лаб") || n.includes("шинж")) return "microscope";
  if (n.includes("реаб") || n.includes("физио")) return "run";
  if (n.includes("нүд") || n.includes("офталь")) return "eye-outline";
  if (n.includes("хөх") || n.includes("эмэгтэй") || n.includes("жирэм")) return "human-female";
  if (n.includes("эрэгтэй") || n.includes("уролог")) return "human-male";
  if (n.includes("мэдрэл") || n.includes("тархи")) return "brain";
  if (n.includes("хөгжим") || n.includes("сэтгэ")) return "head-heart-outline";
  if (n.includes("хөдөлгөөн") || n.includes("яс") || n.includes("ортоп")) return "bone";
  if (n.includes("арьс") || n.includes("дермат")) return "lotion-outline";
  if (n.includes("чих") || n.includes("хамар") || n.includes("хоолой")) return "ear-hearing";
  if (n.includes("шүд") || n.includes("стомат")) return "tooth-outline";
  if (n.includes("вакцин") || n.includes("эмдэглэл")) return "needle";
  if (n.includes("ерөнхий") || n.includes("гэр")) return "home-heart";
  return "medical-bag";
}

export function accentForServiceCategoryIndex(index: number): { accent: string; iconColor: string } {
  const palette = [
    { accent: "bg-brand-50 dark:bg-brand-900/40", iconColor: "#2563eb" },
    { accent: "bg-emerald-50 dark:bg-emerald-950/40", iconColor: "#059669" },
    { accent: "bg-amber-50 dark:bg-amber-950/40", iconColor: "#d97706" },
    { accent: "bg-violet-50 dark:bg-violet-950/40", iconColor: "#7c3aed" },
    { accent: "bg-rose-50 dark:bg-rose-950/40", iconColor: "#e11d48" },
    { accent: "bg-cyan-50 dark:bg-cyan-950/40", iconColor: "#0891b2" },
  ];
  return palette[index % palette.length]!;
}
