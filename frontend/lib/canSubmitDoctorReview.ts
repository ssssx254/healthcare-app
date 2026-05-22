import type { CustomerOrder } from "@/types/customer";

/** Төлбөр төлсөн, баталгаажсан эсвэл дууссан төлбөртэй үзлэгт үнэлгээ үлдээх боломжтой. */
export function orderEligibleForDoctorReview(order: CustomerOrder): boolean {
  return (
    order.kind === "formal" &&
    order.paymentStatus === "paid" &&
    (order.customerStatus === "confirmed" || order.customerStatus === "completed")
  );
}
