import type { OrderUiStatus } from "@/constants/orderStatus";
import type { ProviderBookingStatus } from "@/constants/providerBookingStatus";
import { toConsultationOrderId } from "@/lib/api/orderIds";
import type { ConsultationRow } from "@/services/api/consultationApi";
import type { CustomerOrder } from "@/types/customer";
import type { Booking } from "@/types/healthcare";

function toIso(value: string | undefined): string {
  if (!value) return new Date().toISOString();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function customerStatusFromConsultation(st: string): OrderUiStatus {
  if (st === "cancelled") return "cancelled";
  if (st === "closed") return "completed";
  if (st === "accepted") return "confirmed";
  return "free_consult";
}

function providerStatusFromConsultation(st: string): ProviderBookingStatus {
  if (st === "cancelled") return "cancelled_clinic";
  if (st === "closed") return "completed";
  if (st === "accepted") return "confirmed";
  return "pending_request";
}

export function mapConsultationToCustomerOrder(
  row: ConsultationRow,
  names: { clinicName: string; doctorName: string; serviceTitle?: string },
): CustomerOrder {
  const healthSummary = row.patient_message?.trim() || undefined;
  return {
    id: toConsultationOrderId(row.id),
    createdAtIso: toIso(row.created_at),
    clinicId: String(row.clinic_id),
    clinicName: names.clinicName,
    doctorId: row.doctor_id != null ? String(row.doctor_id) : "",
    doctorName: names.doctorName,
    serviceId: "",
    serviceTitle: names.serviceTitle ?? "Үнэгүй онлайн зөвлөгөө",
    kind: "free_online",
    priceMnt: 0,
    slotLabel: undefined,
    date: undefined,
    time: undefined,
    healthSummary,
    meetingLink: row.meeting_link ?? undefined,
    patientName: undefined,
    paymentStatus: "paid",
    customerStatus: customerStatusFromConsultation(String(row.status)),
    providerStatus: providerStatusFromConsultation(String(row.status)),
  };
}

export function mapConsultationToProviderBooking(
  row: ConsultationRow,
  names: { clinicName: string; doctorName: string; patientLabel: string; serviceTitle?: string },
): Booking {
  const o = mapConsultationToCustomerOrder(row, names);
  return {
    ...o,
    patientName: names.patientLabel,
  };
}
