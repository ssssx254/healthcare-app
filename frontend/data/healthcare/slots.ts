import type { ScheduleSlot } from "@/types/healthcare";

const today = new Date().toISOString().slice(0, 10);

export const fixtureScheduleSlots: ScheduleSlot[] = [
  { id: "t1", doctorId: "d1", clinicId: "c1", dateIso: "2026-04-18", label: "Даваа 10:00 – 10:30" },
  { id: "t2", doctorId: "d1", clinicId: "c1", dateIso: "2026-04-18", label: "Даваа 14:00 – 14:30" },
  { id: "t3", doctorId: "d1", clinicId: "c1", dateIso: "2026-04-19", label: "Мягмар 09:00 – 09:30" },
  { id: "t4", doctorId: "d2", clinicId: "c1", dateIso: "2026-04-18", label: "Даваа 11:00 – 11:25" },
  { id: "t5", doctorId: "d3", clinicId: "c2", dateIso: "2026-04-20", label: "Лхагва 15:00 – 15:30" },
  { id: "t6", doctorId: "d4", clinicId: "c1", dateIso: "2026-04-21", label: "Пүрэв 08:30 – 09:10" },
  { id: "t7", doctorId: "d5", clinicId: "c3", dateIso: today, label: "Өнөөдөр 10:00 – 10:45" },
];
