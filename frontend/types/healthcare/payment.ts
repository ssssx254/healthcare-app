export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type Payment = {
  id: string;
  bookingId: string;
  amountMnt: number;
  status: PaymentStatus;
  createdAtIso: string;
  /** Жишээ: «Дансаар», «Карт». */
  methodMn?: string;
};
