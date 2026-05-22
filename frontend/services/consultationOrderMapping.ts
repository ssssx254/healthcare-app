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

function formatHm(t: string | null | undefined): string {
  if (!t) return "";
  const raw = String(t);
  const m = raw.match(/^(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : raw.slice(0, 5);
}

function slotLabelFromRow(row: ConsultationRow): string | undefined {
  if (!row.slot_date) return undefined;
  const start = formatHm(row.slot_start_time);
  const end = formatHm(row.slot_end_time);
  if (start && end) return `${row.slot_date} ${start} – ${end}`;
  if (start) return `${row.slot_date} ${start}`;
  return row.slot_date;
}

function customerStatusFromConsultation(st: string): OrderUiStatus {
  if (st === "cancelled") return "cancelled";
  if (st === "closed") return "completed";
  if (st === "accepted") return "confirmed";
  return "pending";
}

function providerStatusFromConsultation(st: string): ProviderBookingStatus {
  if (st === "cancelled") return "cancelled_clinic";
  if (st === "closed") return "completed";
  if (st === "accepted") return "confirmed";
  return "pending_request";
}

function healthSummaryFromRow(row: ConsultationRow): string | undefined {
  const parts = [
    row.symptoms ? `Биеийн байдал: ${row.symptoms}` : null,
    row.question ? `Асуух зүйл: ${row.question}` : null,
    row.notes ? `Нэмэлт: ${row.notes}` : null,
    row.patient_message && !row.symptoms && !row.question ? row.patient_message : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join("\n\n") : undefined;
}

export function mapConsultationToCustomerOrder(
  row: ConsultationRow,
  names: { clinicName: string; doctorName: string; serviceTitle?: string },
): CustomerOrder {
  return {
    id: toConsultationOrderId(row.id),
    createdAtIso: toIso(row.created_at),
    clinicId: String(row.clinic_id),
    clinicName: names.clinicName ?? row.clinic_name ?? "",
    doctorId: row.doctor_id != null ? String(row.doctor_id) : "",
    doctorName: names.doctorName ?? row.doctor_name ?? "",
    serviceId: "",
    serviceTitle: names.serviceTitle ?? "Үнэгүй зөвлөгөө",
    kind: "free_online",
    priceMnt: 0,
    slotId: row.slot_id != null ? String(row.slot_id) : undefined,
    slotLabel: slotLabelFromRow(row),
    date: row.slot_date ?? undefined,
    time: row.slot_start_time ? formatHm(row.slot_start_time) : undefined,
    healthSummary: healthSummaryFromRow(row),
    symptoms: row.symptoms ?? undefined,
    question: row.question ?? undefined,
    consultNotes: row.notes ?? undefined,
    providerNotes: row.provider_notes ?? row.provider_message ?? undefined,
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
