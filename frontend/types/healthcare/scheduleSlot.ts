/** Боломжит цагийн слот. */
export type ScheduleSlot = {
  id: string;
  doctorId: string;
  serviceId?: string | null;
  clinicId?: string;
  dateIso: string;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  status?: "available" | "booked" | "blocked" | "unavailable" | string;
  isAvailable?: boolean;
  label: string;
};
