import type { ComponentProps } from "react";
import type { MaterialCommunityIcons } from "@expo/vector-icons";
import { emeraldCategoryCardTheme, type CategoryCardTheme } from "@/constants/categoryCardTheme";

export type AudienceCategory = {
  id: string;
  label: string;
  icon: ComponentProps<typeof MaterialCommunityIcons>["name"];
  searchQuery: string;
} & CategoryCardTheme;

/** Хэрэглэгчийн үндсэн бүлэг — нүүр хуудсын дөрвөлжин карт. */
export const AUDIENCE_CATEGORIES: AudienceCategory[] = [
  {
    id: "men",
    label: "Эрэгтэй",
    icon: "human-male",
    searchQuery: "эрэгтэй",
    ...emeraldCategoryCardTheme,
  },
  {
    id: "women",
    label: "Эмэгтэй",
    icon: "human-female",
    searchQuery: "эмэгтэй",
    ...emeraldCategoryCardTheme,
  },
  {
    id: "children",
    label: "Хүүхэд",
    icon: "baby-face-outline",
    searchQuery: "хүүхэд",
    ...emeraldCategoryCardTheme,
  },
  {
    id: "elderly",
    label: "Настан",
    icon: "account-supervisor-outline",
    searchQuery: "настан",
    ...emeraldCategoryCardTheme,
  },
];
