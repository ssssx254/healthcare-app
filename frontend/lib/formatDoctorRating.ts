import type { MockDoctor } from "@/types/customer";

export function formatDoctorRatingLabel(doctor: Pick<MockDoctor, "averageRating" | "reviewCount">): string {
  const avg = doctor.averageRating;
  const count = doctor.reviewCount ?? 0;
  if (avg == null || count === 0) return "Шинэ";
  return avg.toFixed(1);
}

export function formatDoctorRatingCount(doctor: Pick<MockDoctor, "reviewCount">): string {
  const count = doctor.reviewCount ?? 0;
  if (count === 0) return "Үнэлгээ байхгүй";
  return `${count} сэтгэгдэл`;
}
