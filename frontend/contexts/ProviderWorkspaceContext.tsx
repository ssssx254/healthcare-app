import type { ProviderBookingStatus } from "@/constants/providerBookingStatus";
import { computeProviderStatistics } from "@/data/healthcare";
import {
  getDoctorManagementConfig,
  upsertDoctorManagementConfig,
  type DoctorManagementConfig,
  type WeeklyDayKey,
} from "@/data/healthcare/providerDoctorManagementStore";
import { useAuth } from "@/hooks/useAuth";
import { consultationNumericId, isConsultationOrderId } from "@/lib/api/orderIds";
import { getNetworkSnapshot } from "@/lib/network/networkRuntime";
import { subscribeReconnectRefresh } from "@/lib/network/reconnectRefresh";
import { notifyBookingCancelled, notifyBookingConfirmed } from "@/lib/notifications/eventNotifications";
import { toFriendlyErrorMn } from "@/lib/friendlyErrorMn";
import { bookingApi, providerUiStatusToApiStatus } from "@/services/api/bookingApi";
import { clinicApi } from "@/services/api/clinicApi";
import { clinicCategoryApi } from "@/services/api/clinicCategoryApi";
import { consultationApi } from "@/services/api/consultationApi";
import { doctorApi } from "@/services/api/doctorApi";
import { scheduleApi } from "@/services/api/scheduleApi";
import { serviceApi } from "@/services/api/serviceApi";
import { mergeDoctorPhotoIntoDoctor, mergeDoctorPhotosIntoDoctors } from "@/data/healthcare/doctorPhotoOverridesStore";
import { categoryIdFromName, dedupeCategoryIds } from "@/lib/categoryId";
import {
  loadProviderCategories,
  mergeProviderCategories,
  saveProviderCategories,
} from "@/lib/providerCategoryStorage";
import { providerServiceToCreateBody, providerServiceToFullUpdateBody } from "@/lib/providerServicePayload";
import { mapBookingRowsToCustomerOrders } from "@/services/bookingTransforms";
import { mapConsultationToProviderBooking } from "@/services/consultationOrderMapping";
import { mapDoctorRow, mapServiceRow, mapSlotRow } from "@/services/catalogMappers";
import type { Clinic } from "@/types/healthcare";
import type {
  ProviderBooking,
  ProviderCategory,
  ProviderClinicProfile,
  ProviderDoctor,
  ProviderService,
  ProviderSlot,
} from "@/types/provider";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ProviderWorkspaceValue = {
  clinic: ProviderClinicProfile;
  workspaceLoading: boolean;
  workspaceError: string | null;
  refreshWorkspace: () => Promise<void>;
  setClinic: (patch: Partial<ProviderClinicProfile>) => void;
  registerClinic: (data: Pick<Clinic, "name" | "city" | "address" | "phone" | "description">) => Promise<void>;
  saveClinicToApi: (data: Pick<Clinic, "name" | "city" | "address" | "phone" | "description">) => Promise<void>;
  doctors: ProviderDoctor[];
  addDoctor: (d: Omit<ProviderDoctor, "id">) => Promise<ProviderDoctor>;
  updateDoctor: (id: string, patch: Partial<ProviderDoctor>) => Promise<void>;
  removeDoctor: (id: string) => Promise<void>;
  categories: ProviderCategory[];
  addCategory: (name: string) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;
  services: ProviderService[];
  addService: (s: Omit<ProviderService, "id">, opts?: { deferRefresh?: boolean }) => Promise<string | undefined>;
  updateService: (id: string, patch: Partial<ProviderService>) => Promise<void>;
  removeService: (id: string) => Promise<void>;
  upsertDoctorManagement: (config: DoctorManagementConfig) => void;
  slots: ProviderSlot[];
  addSlot: (
    slot: {
      doctorId: string;
      dateIso: string;
      startTime: string;
      endTime: string;
      serviceId?: string | null;
      consultationType?: "paid_visit" | "free_consultation";
    },
    opts?: { deferRefresh?: boolean },
  ) => Promise<void>;
  blockSlot: (id: string) => Promise<void>;
  removeSlot: (id: string) => Promise<void>;
  bookings: ProviderBooking[];
  setBookingStatus: (id: string, status: ProviderBookingStatus) => Promise<void>;
  setMeetingLink: (id: string, link: string) => Promise<void>;
  todayBookingsCount: number;
  pendingRequestsCount: number;
  totalRevenueMnt: number;
  totalCustomers: number;
};

const ProviderWorkspaceContext = createContext<ProviderWorkspaceValue | null>(null);

const emptyClinic = (): ProviderClinicProfile => ({
  id: "",
  name: "",
  city: "",
  address: "",
  phone: "",
  description: "",
  doctorsCount: 0,
  registered: false,
});

const defaultCategories = (): ProviderCategory[] => [{ id: "cat-general", name: "Ерөнхий" }];

const dayToWeekIndex: Record<WeeklyDayKey, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

function mapClinicRowToProfile(row: import("@/services/api/clinicApi").ClinicRow, doctorsCount: number): ProviderClinicProfile {
  const cityGuess =
    row.city && String(row.city).trim()
      ? String(row.city).trim()
      : row.address.split(",")[0]?.trim() || "—";
  return {
    id: String(row.id),
    name: row.clinic_name,
    city: cityGuess,
    address: row.address,
    phone: row.phone,
    description: row.description?.trim() ?? "",
    doctorsCount,
    registered: true,
  };
}

export function ProviderWorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [clinic, setClinicState] = useState<ProviderClinicProfile>(emptyClinic);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<ProviderDoctor[]>([]);
  const [categories, setCategories] = useState<ProviderCategory[]>(() => defaultCategories());
  const [services, setServices] = useState<ProviderService[]>([]);
  const [slots, setSlots] = useState<ProviderSlot[]>([]);
  const [bookings, setBookings] = useState<ProviderBooking[]>([]);

  const refreshWorkspace = useCallback(async () => {
    if (!user?.id || user.role !== "provider") {
      setClinicState(emptyClinic());
      setDoctors([]);
      setServices([]);
      setSlots([]);
      setBookings([]);
      return;
    }
    setWorkspaceLoading(true);
    setWorkspaceError(null);
    try {
      const { clinic: mine } = await clinicApi.getByProvider(user.id);
      if (!mine) {
        setClinicState(emptyClinic());
        setDoctors([]);
        setServices([]);
        setSlots([]);
        setBookings([]);
        return;
      }
      const cid = String(mine.id);
      const [doctorRows, serviceRows, bookingRows, consultationRows] = await Promise.all([
        doctorApi.listAll({ clinic_id: cid }),
        serviceApi.listAll({ clinic_id: cid }),
        bookingApi.listAllBookings(),
        consultationApi.listAllForProvider(),
      ]);

      const mappedDoctors = doctorRows.map(mapDoctorRow);
      setDoctors(await mergeDoctorPhotosIntoDoctors(mappedDoctors));
      const mappedServices = serviceRows.map(mapServiceRow);
      setServices(mappedServices);
      const derivedCategories = dedupeCategoryIds(
        Array.from(
          new Set(
            mappedServices
              .map((s) => s.categoryName?.trim())
              .filter((v): v is string => Boolean(v)),
          ),
        ).map((name) => ({ id: categoryIdFromName(name), name })),
      );
      let apiCategories: ProviderCategory[] = [];
      try {
        const rows = await clinicCategoryApi.listForClinic(cid);
        apiCategories = rows.map((r) => ({ id: String(r.id), name: r.name.trim() }));
      } catch {
        /* offline / migration pending */
      }
      const persistedCategories = await loadProviderCategories(cid);
      const mergedCategories = mergeProviderCategories(
        mergeProviderCategories(persistedCategories, apiCategories),
        derivedCategories,
      );
      const finalCategories = mergedCategories.length > 0 ? mergedCategories : defaultCategories();
      setCategories(finalCategories);
      await saveProviderCategories(cid, finalCategories);

      const slotLists = await Promise.all(
        doctorRows.map((d) => scheduleApi.listAllSlotsForDoctor(d.id).catch(() => [])),
      );
      const flat: ProviderSlot[] = [];
      slotLists.forEach((list, idx) => {
        const doctorId = String(doctorRows[idx]?.id ?? "");
        for (const s of list) {
          flat.push(mapSlotRow(s));
        }
      });
      setSlots(flat);

      const mappedBookings = await mapBookingRowsToCustomerOrders(bookingRows);
      const consultationBookings = consultationRows
        .filter((cr) => String(cr.clinic_id) === cid)
        .map((cr) => {
          const doctorName =
            cr.doctor_id != null
              ? doctorRows.find((x) => x.id === cr.doctor_id)?.full_name ?? `Эмч #${cr.doctor_id}`
              : "Эмч сонгоогүй";
          const patientLabel = `Өвчтөн #${cr.patient_user_id}`;
          return mapConsultationToProviderBooking(cr, {
            clinicName: mine.clinic_name,
            doctorName,
            patientLabel,
          }) as ProviderBooking;
        });
      setBookings(
        [...consultationBookings, ...(mappedBookings as ProviderBooking[])].sort(
          (a, b) => new Date(b.createdAtIso).getTime() - new Date(a.createdAtIso).getTime(),
        ),
      );

      setClinicState(mapClinicRowToProfile(mine, doctorRows.length));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Өгөгдөл ачааллахад алдаа гарлаа.";
      setWorkspaceError(toFriendlyErrorMn(msg));
    } finally {
      setWorkspaceLoading(false);
    }
  }, [user?.id, user?.role]);

  useEffect(() => {
    void refreshWorkspace();
  }, [refreshWorkspace]);

  useEffect(() => {
    return subscribeReconnectRefresh(() => {
      void refreshWorkspace();
    });
  }, [refreshWorkspace]);

  const setClinic = useCallback((patch: Partial<ProviderClinicProfile>) => {
    setClinicState((c) => ({ ...c, ...patch }));
  }, []);

  const registerClinic = useCallback(
    async (data: Pick<Clinic, "name" | "city" | "address" | "phone" | "description">) => {
      const addressJoined = [data.city?.trim(), data.address?.trim()].filter(Boolean).join(", ") || data.address.trim();
      await clinicApi.create({
        clinic_name: data.name.trim(),
        address: addressJoined,
        phone: data.phone.trim(),
        description: data.description?.trim() || null,
        city: data.city?.trim() || null,
      });
      await refreshWorkspace();
    },
    [refreshWorkspace],
  );

  const saveClinicToApi = useCallback(
    async (data: Pick<Clinic, "name" | "city" | "address" | "phone" | "description">) => {
      if (!clinic.id) throw new Error("Эмнэлэг олдсонгүй.");
      const addressJoined = [data.city?.trim(), data.address?.trim()].filter(Boolean).join(", ") || data.address.trim();
      await clinicApi.update(clinic.id, {
        clinic_name: data.name.trim(),
        description: data.description?.trim() || null,
        address: addressJoined,
        phone: data.phone.trim(),
      });
      await refreshWorkspace();
    },
    [clinic.id, refreshWorkspace],
  );

  function clockToHms(raw: string): string {
    const t = raw.trim();
    if (/^\d{2}:\d{2}:\d{2}$/.test(t)) return t;
    const parts = t.split(":");
    if (parts.length >= 2) {
      const hh = parts[0]!.padStart(2, "0");
      const mm = parts[1]!.slice(0, 2).padStart(2, "0");
      return `${hh}:${mm}:00`;
    }
    return `${t}:00`;
  }

  function normalizeSlotHms(t: string): string {
    const x = t.trim();
    if (/^\d{2}:\d{2}:\d{2}$/.test(x)) return x;
    const m = /^(\d{1,2}):(\d{2})$/.exec(x);
    if (m) return `${m[1]!.padStart(2, "0")}:${m[2]}:00`;
    return x;
  }

  const syncWeeklyScheduleAndGenerateSlots = useCallback(
    async (doctorId: string) => {
      try {
        const cfg = getDoctorManagementConfig(doctorId);
        if (!cfg) return;
        const rangeParts = cfg.weeklySchedule.dayTimeRange.split("-").map((x) => x.trim());
        const fromClock = clockToHms(rangeParts[0] ?? "09:00");
        const toClock = clockToHms(rangeParts[1] ?? "18:00");
        const weekly_schedule = cfg.weeklySchedule.workingDays.map((dayKey) => ({
          weekday: dayToWeekIndex[dayKey],
          start_time: fromClock,
          end_time: toClock,
          is_active: true,
        }));
        await scheduleApi.saveWeeklySchedule(doctorId, weekly_schedule);
        const doctorServices = services.filter((s) => s.doctorId === doctorId && /^\d+$/.test(s.id));
        const formal = doctorServices.find((s) => s.kind === "formal") ?? doctorServices[0];
        if (!formal) return;
        const from = new Date();
        const to = new Date();
        to.setDate(to.getDate() + 21);
        const iso = (d: Date) => d.toISOString().slice(0, 10);
        await scheduleApi.generateSlots({
          doctor_id: Number(doctorId),
          service_id: Number(formal.id),
          from_date: iso(from),
          to_date: iso(to),
        });
        await refreshWorkspace();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Цагийн хуваарь синхрончлоход алдаа гарлаа.";
        setWorkspaceError(toFriendlyErrorMn(msg));
      }
    },
    [services, refreshWorkspace],
  );

  const runAfterServiceMutation = useCallback(
    async (doctorId: string) => {
      if (getDoctorManagementConfig(doctorId)) {
        await syncWeeklyScheduleAndGenerateSlots(doctorId);
      }
    },
    [syncWeeklyScheduleAndGenerateSlots],
  );

  const addDoctor = useCallback(
    async (d: Omit<ProviderDoctor, "id">) => {
      const created = await doctorApi.create({
        clinic_id: Number(d.clinicId),
        full_name: d.name.trim(),
        specialization: d.specialty.trim(),
        title: d.title?.trim() || null,
        bio: d.bio?.trim() || null,
        experience_years: d.experienceYears ?? null,
        education: d.education?.trim() || null,
        work_history: d.workExperience?.trim() || null,
        profile_image: d.imageUrl?.trim() || null,
      });
      const mapped = await mergeDoctorPhotoIntoDoctor(mapDoctorRow(created));
      setDoctors((list) => [mapped, ...list]);
      setClinicState((prev) => ({ ...prev, doctorsCount: prev.doctorsCount + 1 }));
      return mapped;
    },
    [],
  );

  const updateDoctor = useCallback(
    async (id: string, patch: Partial<ProviderDoctor>) => {
      setDoctors((list) => list.map((x) => (x.id === id ? { ...x, ...patch } : x)));
      if (!/^\d+$/.test(String(id))) return;
      const body: Parameters<typeof doctorApi.update>[1] = {};
      if (patch.name !== undefined) body.full_name = patch.name.trim();
      if (patch.specialty !== undefined) body.specialization = patch.specialty.trim();
      if (patch.bio !== undefined) body.bio = patch.bio?.trim() ?? null;
      if (patch.experienceYears !== undefined) body.experience_years = patch.experienceYears ?? null;
      if (patch.title !== undefined) body.title = patch.title?.trim() || null;
      if (patch.education !== undefined) body.education = patch.education?.trim() || null;
      if (patch.workExperience !== undefined) body.work_history = patch.workExperience?.trim() || null;
      if (patch.imageUrl !== undefined) body.profile_image = patch.imageUrl?.trim() || null;
      if (Object.keys(body).length === 0) return;
      await doctorApi.update(id, body);
      await refreshWorkspace();
    },
    [refreshWorkspace],
  );

  const removeDoctor = useCallback(
    async (id: string) => {
      if (!getNetworkSnapshot().isOnline) {
        throw new Error("Интернет холболтгүй үед эмч устгах боломжгүй. Холболтоо шалгаад дахин оролдоно уу.");
      }
      if (!/^\d+$/.test(String(id))) {
        setDoctors((list) => list.filter((x) => x.id !== id));
        setServices((list) => list.filter((s) => s.doctorId !== id));
        setSlots((list) => list.filter((s) => s.doctorId !== id));
        setClinicState((prev) => ({ ...prev, doctorsCount: Math.max(0, prev.doctorsCount - 1) }));
        return;
      }
      await doctorApi.remove(id);
      setDoctors((list) => list.filter((x) => x.id !== id));
      setServices((list) => list.filter((s) => s.doctorId !== id));
      setSlots((list) => list.filter((s) => s.doctorId !== id));
      setClinicState((prev) => ({ ...prev, doctorsCount: Math.max(0, prev.doctorsCount - 1) }));
    },
    [],
  );

  const addCategory = useCallback(
    async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      if (clinic.id && /^\d+$/.test(clinic.id)) {
        try {
          const row = await clinicCategoryApi.create(clinic.id, trimmed);
          setCategories((c) => {
            if (c.some((x) => x.name.trim().toLowerCase() === trimmed.toLowerCase())) return c;
            const next = [...c, { id: String(row.id), name: row.name.trim() }];
            void saveProviderCategories(clinic.id, next);
            return next;
          });
          return;
        } catch {
          /* local fallback */
        }
      }
      setCategories((c) => {
        if (c.some((x) => x.name.trim().toLowerCase() === trimmed.toLowerCase())) return c;
        const baseId = categoryIdFromName(trimmed);
        let id = baseId;
        let n = 0;
        while (c.some((x) => x.id === id)) {
          n += 1;
          id = `${baseId}-${n}`;
        }
        const next = [...c, { id, name: trimmed }];
        if (clinic.id) void saveProviderCategories(clinic.id, next);
        return next;
      });
    },
    [clinic.id],
  );

  const removeCategory = useCallback(
    async (id: string) => {
      if (clinic.id && /^\d+$/.test(clinic.id) && /^\d+$/.test(id)) {
        try {
          await clinicCategoryApi.remove(clinic.id, id);
        } catch {
          /* continue local remove */
        }
      }
      setCategories((c) => {
        const next = c.filter((x) => x.id !== id);
        if (clinic.id) void saveProviderCategories(clinic.id, next);
        return next;
      });
    },
    [clinic.id],
  );

  const upsertDoctorManagement = useCallback(
    (config: DoctorManagementConfig) => {
      upsertDoctorManagementConfig(config);
      void syncWeeklyScheduleAndGenerateSlots(config.doctorId);
    },
    [syncWeeklyScheduleAndGenerateSlots],
  );

  const addService = useCallback(
    async (s: Omit<ProviderService, "id">, opts?: { deferRefresh?: boolean }) => {
      if (!clinic.id) throw new Error("Эмнэлэг олдсонгүй.");
      const created = await serviceApi.create(providerServiceToCreateBody(clinic.id, categories, s));
      const createdId = created?.id != null ? String(created.id) : undefined;
      if (opts?.deferRefresh) return createdId;
      await refreshWorkspace();
      await runAfterServiceMutation(s.doctorId);
      return createdId;
    },
    [clinic.id, categories, refreshWorkspace, runAfterServiceMutation],
  );

  const updateService = useCallback(
    async (id: string, patch: Partial<ProviderService>) => {
      const current = services.find((x) => x.id === id);
      if (!current) return;
      if (!/^\d+$/.test(String(id))) {
        setServices((list) => list.map((x) => (x.id === id ? { ...x, ...patch } : x)));
        return;
      }
      const merged = { ...current, ...patch };
      await serviceApi.update(id, providerServiceToFullUpdateBody(categories, merged));
      await refreshWorkspace();
      await runAfterServiceMutation(merged.doctorId);
    },
    [services, categories, refreshWorkspace, runAfterServiceMutation],
  );

  const removeService = useCallback(
    async (id: string) => {
      const target = services.find((x) => x.id === id);
      const doctorId = target?.doctorId ?? "";
      if (/^\d+$/.test(String(id))) {
        await serviceApi.remove(id);
        await refreshWorkspace();
        if (doctorId) await runAfterServiceMutation(doctorId);
      } else {
        setServices((list) => list.filter((x) => x.id !== id));
      }
    },
    [services, refreshWorkspace, runAfterServiceMutation],
  );

  const addSlot = useCallback(
    async (
      slot: {
        doctorId: string;
        dateIso: string;
        startTime: string;
        endTime: string;
        serviceId?: string | null;
        consultationType?: "paid_visit" | "free_consultation";
      },
      opts?: { deferRefresh?: boolean },
    ) => {
      if (!getNetworkSnapshot().isOnline) {
        throw new Error("Интернет холболтгүй үед хуваарь өөрчлөх боломжгүй. Холболтоо шалгаад дахин оролдоно уу.");
      }
      const toMinutes = (hm: string): number => {
        const [h, m] = hm.trim().split(":").map(Number);
        if (!Number.isFinite(h) || !Number.isFinite(m)) return NaN;
        return h * 60 + m;
      };
      const startM = toMinutes(slot.startTime);
      const endM = toMinutes(slot.endTime);
      if (!Number.isFinite(startM) || !Number.isFinite(endM) || endM <= startM) {
        throw new Error("Эхлэх/дуусах цаг буруу байна. HH:mm хэлбэрээр зөв оруулна уу.");
      }
      const consultationType = slot.consultationType ?? "paid_visit";
      const explicitServiceId =
        slot.serviceId != null && slot.serviceId !== "" && /^\d+$/.test(String(slot.serviceId))
          ? Number(slot.serviceId)
          : null;
      const doctorServices = services.filter((s) => s.doctorId === slot.doctorId && /^\d+$/.test(s.id));
      const fallbackService =
        doctorServices.find((s) => s.kind === "formal" || s.isAmbulatory) ??
        doctorServices.find((s) => !s.isOnline && s.kind !== "free_online") ??
        doctorServices[0] ??
        null;
      const linkedServiceId =
        consultationType === "free_consultation"
          ? null
          : explicitServiceId ?? (fallbackService ? Number(fallbackService.id) : null);
      if (consultationType === "paid_visit" && !linkedServiceId) {
        throw new Error(
          "Төлбөртэй үзлэгийн цагт үйлчилгээ холбогдоогүй байна. Эхлээд амбулаторийн үйлчилгээ үүсгээд дахин оролдоно уу.",
        );
      }
      const overlapExists = slots.some((s) => {
        if (s.doctorId !== slot.doctorId || s.dateIso !== slot.dateIso) return false;
        if (s.status === "unavailable") return false;
        const sStart = toMinutes(s.startTime ?? "");
        const sEnd = toMinutes(s.endTime ?? "");
        if (!Number.isFinite(sStart) || !Number.isFinite(sEnd)) return false;
        return startM < sEnd && endM > sStart;
      });
      if (overlapExists) {
        throw new Error("Давхардсан цагийн слот байна. Өөр цаг сонгоно уу.");
      }
      await scheduleApi.create({
        doctor_id: Number(slot.doctorId),
        service_id: linkedServiceId,
        slot_date: slot.dateIso,
        start_time: normalizeSlotHms(slot.startTime),
        end_time: normalizeSlotHms(slot.endTime),
        is_available: true,
        consultation_type: consultationType,
      });
      if (!opts?.deferRefresh) await refreshWorkspace();
    },
    [refreshWorkspace, services, slots],
  );

  const blockSlot = useCallback(
    async (id: string) => {
      if (!getNetworkSnapshot().isOnline) {
        throw new Error("Интернет холболтгүй үед хуваарь өөрчлөх боломжгүй. Холболтоо шалгаад дахин оролдоно уу.");
      }
      if (/^\d+$/.test(String(id))) {
        await scheduleApi.block(id);
        await refreshWorkspace();
      }
    },
    [refreshWorkspace],
  );

  const removeSlot = useCallback(
    async (id: string) => {
      if (!getNetworkSnapshot().isOnline) {
        throw new Error("Интернет холболтгүй үед хуваарь өөрчлөх боломжгүй. Холболтоо шалгаад дахин оролдоно уу.");
      }
      if (/^\d+$/.test(String(id))) {
        await scheduleApi.markUnavailable(id);
        await refreshWorkspace();
      } else {
        setSlots((list) => list.filter((x) => x.id !== id));
      }
    },
    [refreshWorkspace],
  );

  const setBookingStatus = useCallback(
    async (id: string, status: ProviderBookingStatus) => {
      if (isConsultationOrderId(id)) {
        const numId = consultationNumericId(id);
        if (status === "completed") {
          await consultationApi.update(numId, { status: "closed" });
        } else if (status === "confirmed") {
          await consultationApi.update(numId, { status: "accepted" });
        } else if (status === "rejected" || status === "cancelled_clinic") {
          await consultationApi.update(numId, { status: "cancelled" });
        }
      } else {
        const apiStatus = providerUiStatusToApiStatus(status);
        await bookingApi.updateStatus(id, { status: apiStatus });
      }
      if (status === "confirmed") void notifyBookingConfirmed();
      if (status === "cancelled_clinic" || status === "rejected") void notifyBookingCancelled();
      await refreshWorkspace();
    },
    [refreshWorkspace],
  );

  const setMeetingLink = useCallback(
    async (id: string, link: string) => {
      const trimmed = link.trim() || null;
      if (isConsultationOrderId(id)) {
        await consultationApi.update(consultationNumericId(id), { meeting_link: trimmed });
      } else {
        await bookingApi.updateStatus(id, { meeting_link: trimmed });
      }
      await refreshWorkspace();
    },
    [refreshWorkspace],
  );

  const { todayBookingsCount, pendingRequestsCount, totalRevenueMnt, totalCustomers } = useMemo(
    () => computeProviderStatistics(bookings),
    [bookings],
  );

  const value = useMemo<ProviderWorkspaceValue>(
    () => ({
      clinic,
      workspaceLoading,
      workspaceError,
      refreshWorkspace,
      setClinic,
      registerClinic,
      saveClinicToApi,
      doctors,
      addDoctor,
      updateDoctor,
      removeDoctor,
      categories,
      addCategory,
      removeCategory,
      services,
      addService,
      updateService,
      removeService,
      upsertDoctorManagement,
      slots,
      addSlot,
      blockSlot,
      removeSlot,
      bookings,
      setBookingStatus,
      setMeetingLink,
      todayBookingsCount,
      pendingRequestsCount,
      totalRevenueMnt,
      totalCustomers,
    }),
    [
      clinic,
      workspaceLoading,
      workspaceError,
      refreshWorkspace,
      setClinic,
      registerClinic,
      saveClinicToApi,
      doctors,
      addDoctor,
      updateDoctor,
      removeDoctor,
      categories,
      addCategory,
      removeCategory,
      services,
      addService,
      updateService,
      removeService,
      upsertDoctorManagement,
      slots,
      addSlot,
      blockSlot,
      removeSlot,
      bookings,
      setBookingStatus,
      setMeetingLink,
      todayBookingsCount,
      pendingRequestsCount,
      totalRevenueMnt,
      totalCustomers,
    ],
  );

  return <ProviderWorkspaceContext.Provider value={value}>{children}</ProviderWorkspaceContext.Provider>;
}

export function useProviderWorkspace(): ProviderWorkspaceValue {
  const ctx = useContext(ProviderWorkspaceContext);
  if (!ctx) {
    throw new Error("useProviderWorkspace нь ProviderWorkspaceProvider дотор ашиглагдана.");
  }
  return ctx;
}
