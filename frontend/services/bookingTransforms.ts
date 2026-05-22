import type { OrderUiStatus } from "@/constants/orderStatus";
import type { ProviderBookingStatus } from "@/constants/providerBookingStatus";
import type { BookingRow } from "@/services/api/bookingApi";
import { clinicApi } from "@/services/api/clinicApi";
import { doctorApi } from "@/services/api/doctorApi";
import { scheduleApi, type ScheduleSlotRow } from "@/services/api/scheduleApi";
import { serviceApi } from "@/services/api/serviceApi";
import type { CustomerOrder } from "@/types/customer";
import type { ServiceKind } from "@/types/healthcare";

export type { ScheduleSlotRow };

function toIso(value: string | undefined): string {
  if (!value) return new Date().toISOString();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function slotLabelFromRow(s: ScheduleSlotRow): string {
  return `${s.slot_date} ${String(s.start_time).slice(0, 5)} – ${String(s.end_time).slice(0, 5)}`;
}

function resolveCustomerStatus(row: BookingRow): OrderUiStatus {
  const st = String(row.status);
  const pay = String(row.payment_status);
  const bt = String(row.booking_type);

  if (st === "cancelled") {
    return "cancelled";
  }
  if (bt === "free_online" && st === "confirmed") {
    return "free_consult";
  }
  if (bt === "formal") {
    if (st === "completed") return "completed";
    if (st === "confirmed") return "confirmed";
    if (st === "pending") {
      return pay === "paid" ? "confirmed" : "payment_required";
    }
  }
  return "pending";
}

function resolveProviderStatus(row: BookingRow): ProviderBookingStatus {
  const s = String(row.status);
  if (s === "pending") return "pending_request";
  if (s === "confirmed") return "confirmed";
  if (s === "completed") return "completed";
  if (s === "cancelled") return "cancelled_clinic";
  return "pending_request";
}

function resolveKind(row: BookingRow): ServiceKind {
  return String(row.booking_type) === "free_online" ? "free_online" : "formal";
}

export function mapBookingRowToCustomerOrder(
  row: BookingRow,
  names: { clinicName: string; doctorName: string; serviceTitle: string; slotLabel?: string },
  extras?: { healthSummary?: string; meetingLink?: string; patientName?: string },
): CustomerOrder {
  const priceMnt = Math.round(Number(row.total_amount ?? 0));
  const slotLabel = names.slotLabel;
  const date = slotLabel?.split(" ")[0] ?? undefined;
  const time = slotLabel ? slotLabel.replace(String(date), "").trim() : undefined;
  return {
    id: String(row.id),
    createdAtIso: toIso(row.created_at),
    clinicId: String(row.clinic_id),
    clinicName: names.clinicName,
    doctorId: String(row.doctor_id),
    doctorName: names.doctorName,
    serviceId: String(row.service_id),
    serviceTitle: names.serviceTitle,
    kind: resolveKind(row),
    priceMnt,
    slotId: row.slot_id != null ? String(row.slot_id) : undefined,
    slotLabel,
    date,
    time,
    healthSummary: extras?.healthSummary,
    meetingLink: extras?.meetingLink ?? (row.meeting_link ?? undefined) ?? undefined,
    patientId: String(row.patient_user_id),
    patientName: extras?.patientName,
    paymentStatus: row.payment_status === "paid" ? "paid" : row.payment_status === "refunded" ? "refunded" : "unpaid",
    customerStatus: resolveCustomerStatus(row),
    providerStatus: resolveProviderStatus(row),
  };
}

/** Жагсаалтын мөрийг UI-ийн `CustomerOrder` болгон баяжуулна (нэр, цаг г.м.). */
export async function mapBookingRowsToCustomerOrders(rows: BookingRow[]): Promise<CustomerOrder[]> {
  if (rows.length === 0) return [];

  const clinics = await clinicApi.listAll();
  const clinicNameById = new Map(clinics.map((c) => [c.id, c.clinic_name]));

  const doctorIds = [...new Set(rows.map((r) => r.doctor_id))];
  const serviceIds = [...new Set(rows.map((r) => r.service_id))];

  const doctorMap = new Map<number, Awaited<ReturnType<typeof doctorApi.getById>>>();
  await Promise.all(
    doctorIds.map(async (id) => {
      try {
        doctorMap.set(id, await doctorApi.getById(id));
      } catch {
        doctorMap.set(id, {
          id,
          clinic_id: 0,
          full_name: "Эмч",
          specialization: "",
        });
      }
    }),
  );

  const serviceMap = new Map<number, Awaited<ReturnType<typeof serviceApi.getById>>>();
  await Promise.all(
    serviceIds.map(async (id) => {
      try {
        serviceMap.set(id, await serviceApi.getById(id));
      } catch {
        serviceMap.set(id, {
          id,
          clinic_id: 0,
          service_name: "Үйлчилгээ",
          category: "",
          price: 0,
          is_free_consultation: 0,
          duration_minutes: 30,
        });
      }
    }),
  );

  const slotLabelById = new Map<number, string>();
  const doctorsNeedingSlots = [...new Set(rows.filter((r) => r.slot_id).map((r) => r.doctor_id))];
  await Promise.all(
    doctorsNeedingSlots.map(async (doctorId) => {
      try {
        const slots = await scheduleApi.listAllSlotsForDoctor(doctorId);
        for (const s of slots) {
          slotLabelById.set(s.id, slotLabelFromRow(s));
        }
      } catch {
        /* ignore */
      }
    }),
  );

  return rows.map((row) => {
    const clinicName = clinicNameById.get(row.clinic_id) ?? `Эмнэлэг #${row.clinic_id}`;
    const doc = doctorMap.get(row.doctor_id);
    const svc = serviceMap.get(row.service_id);
    const slotLabel =
      row.slot_id != null ? slotLabelById.get(Number(row.slot_id)) ?? `Цаг #${row.slot_id}` : undefined;
    return mapBookingRowToCustomerOrder(row, {
      clinicName,
      doctorName: doc?.full_name ?? `Эмч #${row.doctor_id}`,
      serviceTitle: svc?.service_name ?? `Үйлчилгээ #${row.service_id}`,
      slotLabel,
    });
  });
}
