export type PaymentAttemptStatus = "pending" | "paid" | "failed" | "cancelled";

const LABELS: Record<PaymentAttemptStatus, string> = {
  pending: "Хүлээгдэж буй",
  paid: "Төлөгдсөн",
  failed: "Амжилтгүй",
  cancelled: "Цуцлагдсан",
};

export function getPaymentStatusLabel(status: string | undefined | null): string {
  if (!status) return "—";
  const key = status.toLowerCase() as PaymentAttemptStatus;
  return LABELS[key] ?? status;
}
