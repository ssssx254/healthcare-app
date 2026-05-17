import type { ServiceCategory } from "@/types/healthcare";

/** Платформын жишээ ангилалууд (эмнэлэг бүр өөрийнхөө нэмж болно). */
export const fixtureServiceCategories: ServiceCategory[] = [
  { id: "cat-gen", name: "Ерөнхий оношлогоо" },
  { id: "cat-int", name: "Дотоодын өвчин" },
  { id: "cat-ped", name: "Хүүхдийн эмч" },
  { id: "cardio", name: "Зүрх судас" },
  { id: "rehab", name: "Реабилитаци" },
];
