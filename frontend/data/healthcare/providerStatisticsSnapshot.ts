import type { ProviderStatistics } from "@/types/healthcare";

/** Жишээ snapshot — `computeProviderStatistics`-тай харьцуулахад ашиглаж болно. */
export const fixtureProviderStatisticsSnapshot: ProviderStatistics = {
  todayBookingsCount: 2,
  pendingRequestsCount: 1,
  totalRevenueMnt: 80000,
  totalCustomers: 4,
  weekConfirmedFormalCount: 2,
  monthRevenueMnt: 125000,
};
