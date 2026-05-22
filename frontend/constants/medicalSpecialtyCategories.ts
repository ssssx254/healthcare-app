import type { ComponentProps } from "react";
import type { MaterialCommunityIcons } from "@expo/vector-icons";
import { emeraldCategoryCardTheme, type CategoryCardTheme } from "@/constants/categoryCardTheme";

export type MedicalSpecialtyCategory = {
  id: string;
  label: string;
  icon: ComponentProps<typeof MaterialCommunityIcons>["name"];
  keywords: string[];
} & CategoryCardTheme;

/** «Бүх ангиллыг харах» — 4 мэргэжлийн чиглэл. */
export const MEDICAL_SPECIALTY_CATEGORIES: MedicalSpecialtyCategory[] = [
  {
    id: "internal",
    label: "Дотор",
    icon: "stomach",
    keywords: ["дотор", "гастро", "эндокрин", "дотоод"],
    ...emeraldCategoryCardTheme,
  },
  {
    id: "surgery",
    label: "Уушги",
    icon: "hospital-box",
    keywords: ["уушги", "хирург", "мэс", "surgery"],
    ...emeraldCategoryCardTheme,
  },
  {
    id: "cardio",
    label: "Зүрх",
    icon: "heart-pulse",
    keywords: ["зүрх", "судас", "cardio"],
    ...emeraldCategoryCardTheme,
  },
  {
    id: "neuro",
    label: "Мэдрэл",
    icon: "brain",
    keywords: ["мэдрэл", "тархи", "neuro"],
    ...emeraldCategoryCardTheme,
  },
];
