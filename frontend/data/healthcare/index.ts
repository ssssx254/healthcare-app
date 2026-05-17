export { fixtureBookings } from "./bookings";
export { fixtureClinics } from "./clinics";
export { fixtureConsultationRequests } from "./consultationRequests";
export { fixtureDefaultHealthQuestionnaire, fixtureQuestionnaireSubmissions } from "./questionnaire";
export { fixtureCustomerNotifications, fixtureProviderNotifications } from "./notifications";
export { fixtureDoctors } from "./doctors";
export { fixtureMeetingLinks } from "./meetingLinks";
export { fixturePatients } from "./patients";
export { fixturePayments } from "./payments";
export { fixtureProviderStaff } from "./providerStaff";
export { fixtureReviews } from "./reviews";
export { fixtureScheduleSlots } from "./slots";
export { fixtureServices } from "./services";
export { fixtureServiceCategories } from "./categories";
export { fixtureUsers } from "./users";
export { computeProviderStatistics } from "./stats";
export { fixtureProviderStatisticsSnapshot } from "./providerStatisticsSnapshot";

import { fixtureClinics } from "./clinics";
import type { ClinicListItem } from "@/types/healthcare";

export const fixtureClinicListItems: ClinicListItem[] = fixtureClinics.map((c) => ({
  id: c.id,
  name: c.name,
  city: c.city,
  doctorsCount: c.doctorsCount,
}));
