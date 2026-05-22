/** Backend consultation_requests.status → монгол UI */
export type ConsultationApiStatus = "pending" | "accepted" | "closed" | "cancelled";

const LABELS: Record<ConsultationApiStatus, string> = {
  pending: "Хүлээгдэж буй",
  accepted: "Зөвшөөрсөн",
  cancelled: "Татгалзсан",
  closed: "Дууссан",
};

export function getConsultationStatusLabel(status: string | undefined | null): string {
  if (!status) return "—";
  const key = status.toLowerCase() as ConsultationApiStatus;
  return LABELS[key] ?? status;
}
