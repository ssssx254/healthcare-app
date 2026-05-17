/** Эмнэлгийн талын самбарын тоон үзүүлэлтүүд (жишээ / snapshot). */
export type ProviderStatistics = {
  todayBookingsCount: number;
  pendingRequestsCount: number;
  totalRevenueMnt: number;
  totalCustomers: number;
  weekConfirmedFormalCount?: number;
  monthRevenueMnt?: number;
};
