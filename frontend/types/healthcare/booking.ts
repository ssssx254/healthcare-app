import type { OrderUiStatus } from "@/constants/orderStatus";
import type { ProviderBookingStatus } from "@/constants/providerBookingStatus";
import type { ServiceKind } from "./serviceKind";

/** Захиалга (үйлчлүүлэгч болон эмнэлгийн талд нийтлэг). */
export type Booking = {
  id: string;
  createdAtIso: string;
  /** Захиалсан үзлэгийн өдөр (YYYY-MM-DD), slot байвал тэндээс авна. */
  date?: string;
  /** Захиалсан үзлэгийн цагийн хэсэг (HH:mm - HH:mm). */
  time?: string;
  clinicId: string;
  clinicName: string;
  doctorId: string;
  doctorName: string;
  serviceId: string;
  serviceTitle: string;
  kind: ServiceKind;
  priceMnt: number;
  slotId?: string;
  slotLabel?: string;
  healthSummary?: string;
  /** Үнэгүй зөвлөгөөний талбарууд */
  symptoms?: string;
  question?: string;
  consultNotes?: string;
  providerNotes?: string;
  meetingLink?: string;
  patientId?: string;
  patientName?: string;
  /** Төлбөрийн API төлөв (paid / unpaid гэх мэт). */
  paymentStatus?: "paid" | "unpaid" | "refunded";
  customerStatus: OrderUiStatus;
  /** Эмнэлгийн талын төлөв — бүх захиалганд заавал (үйлчлүүлэгч тал үүсгэхэд онооно). */
  providerStatus: ProviderBookingStatus;
};

/** Үйлчлүүлэгчийн захиалгын дэлгэц — `Booking`-той ижил бүтэц. */
export type CustomerOrder = Booking;

/** Захиалга үүсгэхийн өмнөх түр хадгалалт. */
export type BookingDraft = {
  clinicId: string | null;
  clinicName: string | null;
  doctorId: string | null;
  doctorName: string | null;
  serviceId: string | null;
  serviceName: string | null;
  serviceTitle: string | null;
  duration: number | null;
  durationMinutes: number | null;
  kind: ServiceKind | null;
  price: number | null;
  priceMnt: number | null;
  slotId: string | null;
  slotLabel: string | null;
  selectedDate: string | null;
  selectedTime: string | null;
  bookingId: string | null;
  questionnaireAnswers: {
    symptoms: string;
    chronicIllness: string;
    medications: string;
    allergies: string;
  };
  symptoms: string;
  chronicIllness: string;
  medications: string;
  allergies: string;
  questionnaireCompleted: boolean;
  /** Захиалгад эмчид хуваалцах шинжилгээний ID-ууд */
  sharedLabTestIds: number[];
};
