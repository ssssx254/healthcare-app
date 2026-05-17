import type { ServiceKind } from "./serviceKind";

/** Эмчийн үзүүлэх үйлчилгээ (онлайн зөвлөгөө эсвэл цаг товлолт). */
export type HealthcareService = {
  id: string;
  doctorId: string;
  categoryId?: string;
  categoryName?: string;
  title: string;
  durationMinutes: number;
  isOnline?: boolean;
  isAmbulatory?: boolean;
  isActive?: boolean;
  kind: ServiceKind;
  priceMnt: number;
  description: string;
};

/** Domain нэр: `HealthcareService`. */
export type Service = HealthcareService;
