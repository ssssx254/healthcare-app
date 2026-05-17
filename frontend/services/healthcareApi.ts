import { getClinicList } from "@/services/customerCatalog";
import type { MockClinicDetail } from "@/types/customer";

/**
 * Дотоод API-ийн нэг давхарга — `customerCatalog` → HTTP backend.
 */
export async function fetchClinics(): Promise<MockClinicDetail[]> {
  return getClinicList();
}
