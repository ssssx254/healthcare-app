/** Захиалга / үйлчилгээний төлөв — UI-д зөвхөн монгол хэлээр. */
export type OrderUiStatus =
  | "free_consult"
  | "payment_required"
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled";

export const orderStatusLabel: Record<OrderUiStatus, string> = {
  free_consult: "Үнэгүй зөвлөгөө",
  payment_required: "Төлбөр шаардлагатай",
  pending: "Хүлээгдэж буй",
  confirmed: "Баталгаажсан",
  completed: "Дууссан",
  cancelled: "Цуцлагдсан",
};
