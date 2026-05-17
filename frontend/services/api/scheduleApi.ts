import { apiRequest, apiRequestPaginated } from "@/lib/api/client";
import { withQuery } from "@/lib/api/query";
import type { ApiPaginatedData } from "@/types/api/envelope";

export type ScheduleSlotRow = {
  id: number;
  doctor_id: number;
  service_id?: number | null;
  slot_date: string;
  start_time: string;
  end_time: string;
  is_available: number | boolean;
  slot_status?: "available" | "booked" | "blocked" | "unavailable" | string;
};

export type ScheduleListParams = {
  doctor_id?: string | number;
  from_date?: string;
  to_date?: string;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
};

export type ScheduleAvailableParams = {
  doctor_id: string | number;
  service_id?: string | number;
  from_date?: string;
  to_date?: string;
  page?: number;
  page_size?: number;
};

export type WeeklyScheduleRow = {
  weekday: number;
  start_time: string;
  end_time: string;
  is_active?: boolean;
};

export const scheduleApi = {
  create(body: {
    doctor_id: number;
    service_id?: number | null;
    slot_date: string;
    start_time: string;
    end_time: string;
    is_available?: boolean;
  }): Promise<ScheduleSlotRow> {
    return apiRequest<ScheduleSlotRow>("/schedule-slots", { method: "POST", json: body });
  },

  update(
    id: string | number,
    body: Partial<{
      service_id: number | null;
      slot_date: string;
      start_time: string;
      end_time: string;
      is_available: boolean;
      slot_status: string;
    }>,
  ): Promise<ScheduleSlotRow> {
    return apiRequest<ScheduleSlotRow>(`/schedule-slots/${id}`, { method: "PUT", json: body });
  },

  markUnavailable(id: string | number): Promise<ScheduleSlotRow> {
    return apiRequest<ScheduleSlotRow>(`/schedule-slots/${id}/unavailable`, { method: "PATCH" });
  },

  block(id: string | number): Promise<ScheduleSlotRow> {
    return apiRequest<ScheduleSlotRow>(`/schedule-slots/${id}/block`, { method: "PATCH" });
  },

  saveWeeklySchedule(doctorId: string | number, weekly_schedule: WeeklyScheduleRow[]): Promise<unknown> {
    return apiRequest<unknown>(`/schedule-slots/weekly/${doctorId}`, {
      method: "PUT",
      json: { weekly_schedule },
    });
  },

  generateSlots(body: {
    doctor_id: number;
    service_id: number;
    from_date: string;
    to_date: string;
  }): Promise<{ doctor_id: number; service_id: number; generated_count: number }> {
    return apiRequest("/schedule-slots/generate", { method: "POST", json: body });
  },

  /** Эмнэлгийн тал: эмчийн бүх слот (хуудаслалттай). */
  listSlotsPaged(params: ScheduleListParams): Promise<ApiPaginatedData<ScheduleSlotRow>> {
    return apiRequestPaginated<ScheduleSlotRow>(withQuery("/schedule-slots", params));
  },

  /** Үйлчлүүлэгч: боломжит цагийн цонх. `GET /schedule-slots/available` */
  listAvailablePaged(params: ScheduleAvailableParams): Promise<ApiPaginatedData<ScheduleSlotRow>> {
    return apiRequestPaginated<ScheduleSlotRow>(withQuery("/schedule-slots/available", params));
  },

  /** Бүх хуудсыг нэгтгэж авна (жижиг өгөгдөлд). */
  async listAllSlotsForDoctor(
    doctorId: string | number,
    extra?: Omit<ScheduleListParams, "doctor_id" | "page">,
  ): Promise<ScheduleSlotRow[]> {
    const pageSize = 100;
    const out: ScheduleSlotRow[] = [];
    let page = 1;
    while (true) {
      const { items, meta } = await this.listSlotsPaged({ ...extra, doctor_id: doctorId, page, page_size: pageSize });
      out.push(...items);
      if (!meta.hasNext) break;
      page += 1;
    }
    return out;
  },

  /** Үйлчлүүлэгчийн каталог: боломжит слотууд (эхний хуудсыг хангалттай гэж үзнэ). */
  async listAvailableSlotsForCustomer(params: {
    doctor_id: string | number;
    service_id?: string | number;
    from_date?: string;
    to_date?: string;
    page_size?: number;
  }): Promise<ScheduleSlotRow[]> {
    const { items } = await this.listAvailablePaged({
      doctor_id: params.doctor_id,
      service_id: params.service_id,
      from_date: params.from_date,
      to_date: params.to_date,
      page: 1,
      page_size: params.page_size ?? 200,
    });
    return items;
  },
};
