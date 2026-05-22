import { consultationNumericId, isConsultationOrderId, toConsultationOrderId } from "@/lib/api/orderIds";
import { bookingApi } from "@/services/api/bookingApi";
import type { PayBookingBody } from "@/services/api/walletApi";
import { clinicApi } from "@/services/api/clinicApi";
import { consultationApi } from "@/services/api/consultationApi";
import { doctorApi } from "@/services/api/doctorApi";
import { questionnaireApi } from "@/services/api/questionnaireApi";
import { mapBookingRowsToCustomerOrders } from "@/services/bookingTransforms";
import { mapConsultationToCustomerOrder } from "@/services/consultationOrderMapping";
import type { BookingDraft, CustomerOrder, ServiceKind } from "@/types/customer";
import { toFriendlyErrorMn } from "@/lib/friendlyErrorMn";
import { notifyBookingCancelled, notifyBookingCreated, notifyPaymentSucceeded, notifyVisitReminder } from "@/lib/notifications/eventNotifications";
import { useAuth } from "@/hooks/useAuth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

async function loadMergedCustomerOrders(): Promise<CustomerOrder[]> {
  const [bookingRows, consultations, clinicList] = await Promise.all([
    bookingApi.listAllBookings(),
    consultationApi.listAllForCustomer(),
    clinicApi.listAll(),
  ]);
  const clinicNameById = new Map(clinicList.map((c) => [c.id, c.clinic_name]));

  const bookOrders = await mapBookingRowsToCustomerOrders(bookingRows);

  const consultOrders: CustomerOrder[] = [];
  for (const cr of consultations) {
    const clinicName = clinicNameById.get(cr.clinic_id) ?? `Эмнэлэг #${cr.clinic_id}`;
    let doctorName = "Эмч сонгоогүй";
    if (cr.doctor_id) {
      try {
        const d = await doctorApi.getById(cr.doctor_id);
        doctorName = d.full_name;
      } catch {
        doctorName = `Эмч #${cr.doctor_id}`;
      }
    }
    consultOrders.push(mapConsultationToCustomerOrder(cr, { clinicName, doctorName }));
  }

  return [...consultOrders, ...bookOrders].sort(
    (a, b) => new Date(b.createdAtIso).getTime() - new Date(a.createdAtIso).getTime(),
  );
}

type CustomerBookingContextValue = {
  draft: BookingDraft;
  orders: CustomerOrder[];
  ordersLoading: boolean;
  ordersError: string | null;
  refreshOrders: () => Promise<CustomerOrder[]>;
  setDraftClinic: (id: string, name: string) => void;
  setDraftDoctor: (id: string, name: string) => void;
  setDraftService: (id: string, title: string, kind: ServiceKind, priceMnt: number, durationMinutes: number) => void;
  setDraftSlot: (id: string, label: string, date?: string | null, time?: string | null) => void;
  setDraftHealth: (patch: Partial<Pick<BookingDraft, "symptoms" | "chronicIllness" | "medications" | "allergies">>) => void;
  setSharedLabTestIds: (ids: number[]) => void;
  resetDraft: () => void;
  createFormalOrderAfterConfirm: () => Promise<CustomerOrder | null>;
  completePayment: (orderId: string, payment?: PayBookingBody) => Promise<void>;
  addFreeConsultOrder: (params: {
    clinicId: string;
    clinicName: string;
    doctorId: string;
    doctorName: string;
    slotId: number;
    symptoms: string;
    question: string;
    notes?: string | null;
  }) => Promise<CustomerOrder | null>;
  cancelOrder: (orderId: string) => Promise<void>;
};

const emptyDraft = (): BookingDraft => ({
  clinicId: null,
  clinicName: null,
  doctorId: null,
  doctorName: null,
  serviceId: null,
  serviceName: null,
  serviceTitle: null,
  duration: null,
  durationMinutes: null,
  kind: null,
  price: null,
  priceMnt: null,
  slotId: null,
  slotLabel: null,
  selectedDate: null,
  selectedTime: null,
  bookingId: null,
  questionnaireAnswers: {
    symptoms: "",
    chronicIllness: "",
    medications: "",
    allergies: "",
  },
  symptoms: "",
  chronicIllness: "",
  medications: "",
  allergies: "",
  questionnaireCompleted: false,
  sharedLabTestIds: [],
});

const CustomerBookingContext = createContext<CustomerBookingContextValue | null>(null);

export function CustomerBookingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [draft, setDraft] = useState<BookingDraft>(emptyDraft());
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  const refreshOrders = useCallback(async (): Promise<CustomerOrder[]> => {
    if (!user?.id || user.role !== "customer") {
      setOrders([]);
      return [];
    }
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      const merged = await loadMergedCustomerOrders();
      setOrders(merged);
      return merged;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Захиалгууд ачааллахад алдаа гарлаа.";
      setOrdersError(toFriendlyErrorMn(msg));
      setOrders([]);
      return [];
    } finally {
      setOrdersLoading(false);
    }
  }, [user?.id, user?.role]);

  const resetDraft = useCallback(() => setDraft(emptyDraft()), []);

  const setDraftClinic = useCallback((id: string, name: string) => {
    setDraft((d) => {
      // Ижил эмнэлэг дээр дахин hydrate хийх үед өмнөх сонголтуудыг бүү арилга.
      if (d.clinicId === id) {
        return { ...d, clinicId: id, clinicName: name };
      }
      // Эмнэлэг өөрчлөгдвөл эмч/үйлчилгээ/цагийн сонголтыг цэвэрлэнэ.
      return {
        ...d,
        clinicId: id,
        clinicName: name,
        doctorId: null,
        doctorName: null,
        serviceId: null,
        serviceName: null,
        serviceTitle: null,
        duration: null,
        durationMinutes: null,
        kind: null,
        price: null,
        priceMnt: null,
        slotId: null,
        slotLabel: null,
        selectedDate: null,
        selectedTime: null,
        bookingId: null,
      };
    });
  }, []);

  const setDraftDoctor = useCallback((id: string, name: string) => {
    setDraft((d) => {
      if (d.doctorId === id) return { ...d, doctorId: id, doctorName: name };
      return {
        ...d,
        doctorId: id,
        doctorName: name,
        serviceId: null,
        serviceName: null,
        serviceTitle: null,
        duration: null,
        durationMinutes: null,
        kind: null,
        price: null,
        priceMnt: null,
        slotId: null,
        slotLabel: null,
        selectedDate: null,
        selectedTime: null,
        bookingId: null,
      };
    });
  }, []);

  const setDraftService = useCallback(
    (id: string, title: string, kind: ServiceKind, priceMnt: number, durationMinutes: number) => {
      setDraft((d) => ({
        ...d,
        serviceId: id,
        serviceName: title,
        serviceTitle: title,
        duration: durationMinutes,
        durationMinutes,
        kind,
        price: priceMnt,
        priceMnt,
        slotId: null,
        slotLabel: null,
        selectedDate: null,
        selectedTime: null,
        bookingId: null,
      }));
    },
    [],
  );

  const setDraftSlot = useCallback((id: string, label: string, date?: string | null, time?: string | null) => {
    const raw = label.trim();
    const parts = raw.split(" ");
    const rawDate = date ?? parts[0] ?? null;
    const dateMatch = rawDate != null ? String(rawDate).match(/^(\d{4}-\d{2}-\d{2})/) : null;
    const selectedDate = dateMatch ? dateMatch[1] : rawDate;
    const selectedTime = time ?? (parts.slice(1).join(" ").trim() || null);
    setDraft((d) => ({ ...d, slotId: id, slotLabel: label, selectedDate, selectedTime, bookingId: null }));
  }, []);

  const setSharedLabTestIds = useCallback((ids: number[]) => {
    setDraft((d) => ({ ...d, sharedLabTestIds: ids }));
  }, []);

  const setDraftHealth = useCallback(
    (patch: Partial<Pick<BookingDraft, "symptoms" | "chronicIllness" | "medications" | "allergies">>) => {
      setDraft((d) => ({
        ...d,
        ...patch,
        questionnaireAnswers: {
          symptoms: patch.symptoms ?? d.questionnaireAnswers.symptoms,
          chronicIllness: patch.chronicIllness ?? d.questionnaireAnswers.chronicIllness,
          medications: patch.medications ?? d.questionnaireAnswers.medications,
          allergies: patch.allergies ?? d.questionnaireAnswers.allergies,
        },
        questionnaireCompleted: true,
      }));
    },
    [],
  );

  const buildHealthAnswers = useCallback((d: BookingDraft): Record<string, string | number | boolean> => {
    const answers: Record<string, string | number | boolean> = {};
    if (d.questionnaireAnswers.symptoms.trim()) answers.symptoms = d.questionnaireAnswers.symptoms.trim();
    if (d.questionnaireAnswers.chronicIllness.trim()) answers.chronicIllness = d.questionnaireAnswers.chronicIllness.trim();
    if (d.questionnaireAnswers.medications.trim()) answers.medications = d.questionnaireAnswers.medications.trim();
    if (d.questionnaireAnswers.allergies.trim()) answers.allergies = d.questionnaireAnswers.allergies.trim();
    return answers;
  }, []);

  const createFormalOrderAfterConfirm = useCallback(async (): Promise<CustomerOrder | null> => {
    if (
      !draft.clinicId ||
      !draft.clinicName ||
      !draft.doctorId ||
      !draft.doctorName ||
      !draft.serviceId ||
      !(draft.serviceName ?? draft.serviceTitle) ||
      draft.kind !== "formal" ||
      (draft.price ?? draft.priceMnt) === null ||
      !draft.slotId ||
      !draft.selectedDate ||
      !draft.selectedTime
    ) {
      return null;
    }
    if (draft.bookingId) {
      const mapped = await refreshOrders();
      return mapped.find((o) => o.id === draft.bookingId) ?? null;
    }
    const created = await bookingApi.create({
      clinic_id: Number(draft.clinicId),
      doctor_id: Number(draft.doctorId),
      service_id: Number(draft.serviceId),
      slot_id: Number(draft.slotId),
      lab_test_ids: draft.sharedLabTestIds.length > 0 ? draft.sharedLabTestIds : undefined,
    });
    setDraft((d) => ({ ...d, bookingId: String(created.id) }));
    void notifyBookingCreated();
    void notifyVisitReminder();
    const hasHealthAnswer = Object.values(draft.questionnaireAnswers).some((v) => v.trim().length > 0);
    if (draft.questionnaireCompleted || hasHealthAnswer) {
      const answers = buildHealthAnswers(draft);
      if (Object.keys(answers).length > 0) {
        await questionnaireApi.create({
          booking_id: Number(created.id),
          answers,
        });
      }
    }
    const mapped = await refreshOrders();
    return mapped.find((o) => o.id === String(created.id)) ?? null;
  }, [draft, buildHealthAnswers, refreshOrders]);

  const completePayment = useCallback(
    async (orderId: string, payment?: PayBookingBody) => {
      if (isConsultationOrderId(orderId)) {
        throw new Error("Үнэгүй зөвлөгөөнд төлбөр шаардлагагүй.");
      }
      const body: PayBookingBody = payment ?? {
        booking_id: Number(orderId),
        channel: "wallet",
      };
      if (body.channel === "qpay" && body.qpay_invoice_id) {
        void notifyPaymentSucceeded();
        await refreshOrders();
        resetDraft();
        return;
      }
      await bookingApi.markPaid(orderId, body);
      void notifyPaymentSucceeded();
      await refreshOrders();
      resetDraft();
    },
    [refreshOrders, resetDraft],
  );

  const addFreeConsultOrder = useCallback(
    async (params: {
      clinicId: string;
      clinicName: string;
      doctorId: string;
      doctorName: string;
      slotId: number;
      symptoms: string;
      question: string;
      notes?: string | null;
    }): Promise<CustomerOrder | null> => {
      const created = await consultationApi.create({
        clinic_id: Number(params.clinicId),
        doctor_id: Number(params.doctorId),
        slot_id: params.slotId,
        symptoms: params.symptoms.trim(),
        question: params.question.trim(),
        notes: params.notes?.trim() || null,
        request_type: "online",
        is_free: true,
      });
      const mapped = await refreshOrders();
      return mapped.find((o) => o.id === toConsultationOrderId(created.id)) ?? null;
    },
    [refreshOrders],
  );

  const cancelOrder = useCallback(
    async (orderId: string) => {
      if (isConsultationOrderId(orderId)) {
        await consultationApi.cancel(consultationNumericId(orderId));
      } else {
        await bookingApi.cancel(orderId);
      }
      void notifyBookingCancelled();
      await refreshOrders();
    },
    [refreshOrders],
  );

  useEffect(() => {
    if (user?.id && user.role === "customer") {
      void refreshOrders();
    }
  }, [user?.id, user?.role, refreshOrders]);

  const value = useMemo(
    () => ({
      draft,
      orders,
      ordersLoading,
      ordersError,
      refreshOrders,
      setDraftClinic,
      setDraftDoctor,
      setDraftService,
      setDraftSlot,
      setDraftHealth,
      setSharedLabTestIds,
      resetDraft,
      createFormalOrderAfterConfirm,
      completePayment,
      addFreeConsultOrder,
      cancelOrder,
    }),
    [
      draft,
      orders,
      ordersLoading,
      ordersError,
      refreshOrders,
      setDraftClinic,
      setDraftDoctor,
      setDraftService,
      setDraftSlot,
      setDraftHealth,
      setSharedLabTestIds,
      resetDraft,
      createFormalOrderAfterConfirm,
      completePayment,
      addFreeConsultOrder,
      cancelOrder,
    ],
  );

  return <CustomerBookingContext.Provider value={value}>{children}</CustomerBookingContext.Provider>;
}

export function useCustomerBooking(): CustomerBookingContextValue {
  const ctx = useContext(CustomerBookingContext);
  if (!ctx) {
    throw new Error("useCustomerBooking нь CustomerBookingProvider дотор ашиглагдана.");
  }
  return ctx;
}
