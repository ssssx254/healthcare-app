import type { Review } from "@/types/healthcare";

export const fixtureReviews: Review[] = [
  {
    id: "rev-1",
    clinicId: "c1",
    doctorId: "d1",
    patientNameMn: "Дорж",
    rating: 5,
    commentMn: "Тайлбартай, ойлгомжтой зөвлөгөө өгсөн. Баярлалаа!",
    createdAtIso: "2026-03-20T12:00:00.000Z",
  },
  {
    id: "rev-2",
    clinicId: "c1",
    doctorId: "d2",
    patientNameMn: "Сувд",
    rating: 5,
    commentMn: "Хүүхдийн эмч маш сайн. Дахин захиална.",
    createdAtIso: "2026-04-01T18:30:00.000Z",
  },
  {
    id: "rev-3",
    clinicId: "c2",
    doctorId: "d3",
    patientNameMn: "Бат",
    rating: 4,
    commentMn: "Хүлээлт бага зэрэг урт байсан ч үйлчилгээ сайн.",
    createdAtIso: "2026-04-05T10:00:00.000Z",
  },
];
