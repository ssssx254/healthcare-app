import type { Payment } from "@/types/healthcare";

export const fixturePayments: Payment[] = [
  {
    id: "pay-1",
    bookingId: "ord-sample-3",
    amountMnt: 35000,
    status: "paid",
    createdAtIso: "2026-04-14T09:00:00.000Z",
    methodMn: "Карт (жишээ)",
  },
  {
    id: "pay-2",
    bookingId: "ord-sample-2",
    amountMnt: 45000,
    status: "pending",
    createdAtIso: "2026-04-12T11:05:00.000Z",
    methodMn: "Дансаар шилжүүлэх",
  },
];
