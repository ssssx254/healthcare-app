import type { Booking, ProviderStatistics } from "@/types/healthcare";

export function computeProviderStatistics(bookings: Booking[]): ProviderStatistics {
  const todayIso = new Date().toISOString().slice(0, 10);
  const todayBookingsCount = bookings.filter((b) => b.createdAtIso.slice(0, 10) === todayIso).length;
  const pendingRequestsCount = bookings.filter((b) => b.providerStatus === "pending_request").length;
  const totalRevenueMnt = bookings
    .filter((b) => b.kind === "formal" && b.providerStatus === "confirmed")
    .reduce((s, b) => s + b.priceMnt, 0);
  const names = new Set(bookings.map((b) => b.patientName).filter((n): n is string => Boolean(n?.trim())));
  const totalCustomers = names.size;
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekIso = weekAgo.toISOString();
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  const monthIso = monthAgo.toISOString();
  const weekConfirmedFormalCount = bookings.filter(
    (b) =>
      b.kind === "formal" &&
      b.providerStatus === "confirmed" &&
      b.createdAtIso >= weekIso,
  ).length;
  const monthRevenueMnt = bookings
    .filter((b) => b.kind === "formal" && b.providerStatus === "confirmed" && b.createdAtIso >= monthIso)
    .reduce((s, b) => s + b.priceMnt, 0);

  return {
    todayBookingsCount,
    pendingRequestsCount,
    totalRevenueMnt,
    totalCustomers,
    weekConfirmedFormalCount,
    monthRevenueMnt,
  };
}
