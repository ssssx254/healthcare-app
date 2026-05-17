/**
 * Үйлчлүүлэгчийн талын төрлүүд — `types/healthcare`-аас дахин экспорт.
 * `Mock*` нэрүүд нь өмнөх кодтой нийцэх нэршлийн alias.
 */
export type {
  BookingDraft,
  CustomerOrder,
  ServiceKind,
  Clinic as MockClinicDetail,
  Doctor as MockDoctor,
  HealthcareService as MockService,
  ScheduleSlot as MockTimeSlot,
} from "./healthcare";
