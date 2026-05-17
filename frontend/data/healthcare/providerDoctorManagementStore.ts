export type WeeklyDayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type DoctorWeeklySchedule = {
  workingDays: WeeklyDayKey[];
  dayTimeRange: string; // HH:mm-HH:mm
  breakTime: string; // HH:mm-HH:mm
};

export type DoctorConsultationConfig = {
  online: boolean;
  ambulatory: boolean;
};

export type DoctorManagementConfig = {
  doctorId: string;
  consultation: DoctorConsultationConfig;
  weeklySchedule: DoctorWeeklySchedule;
};

const configs = new Map<string, DoctorManagementConfig>();

export function upsertDoctorManagementConfig(next: DoctorManagementConfig) {
  configs.set(next.doctorId, next);
}

export function getDoctorManagementConfig(doctorId: string): DoctorManagementConfig | undefined {
  return configs.get(doctorId);
}

