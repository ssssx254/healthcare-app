/** Эмнэлгийн талд харагдах захиалгын төлөв — зөвхөн монгол UI. */
export type ProviderBookingStatus =
  | "pending_request"
  | "confirmed"
  | "completed"
  | "rejected"
  | "cancelled_clinic"
  | "cancelled_patient";

export const providerBookingStatusLabel: Record<ProviderBookingStatus, string> = {
  pending_request: "Хүлээгдэж буй",
  confirmed: "Баталгаажсан",
  completed: "Дууссан",
  rejected: "Татгалзсан",
  cancelled_clinic: "Цуцлагдсан (эмнэлэг)",
  cancelled_patient: "Цуцлагдсан (өвчтөн)",
};
