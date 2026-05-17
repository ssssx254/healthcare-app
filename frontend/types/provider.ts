/**
 * Эмнэлгийн талын төрлүүд — `types/healthcare`-аас дахин экспорт.
 * `Provider*` нэрүүд нь өмнөх кодтой нийцэх alias.
 */
export type {
  Booking as ProviderBooking,
  ClinicWorkspaceState as ProviderClinicProfile,
  Doctor as ProviderDoctor,
  HealthcareService as ProviderService,
  ScheduleSlot as ProviderSlot,
  ServiceCategory as ProviderCategory,
} from "./healthcare";
