import type { ProviderBooking, ProviderCategory, ProviderDoctor, ProviderService, ProviderSlot } from "@/types/provider";
import {
  fixtureBookings,
  fixtureDoctors,
  fixtureScheduleSlots,
  fixtureServiceCategories,
  fixtureServices,
} from "@/data/healthcare";

const c1DoctorIds = new Set(fixtureDoctors.filter((d) => d.clinicId === "c1").map((d) => d.id));

export const defaultProviderCategories: ProviderCategory[] = [...fixtureServiceCategories];

export const initialProviderDoctors: ProviderDoctor[] = fixtureDoctors.filter((d) => d.clinicId === "c1");

export const initialProviderServices: ProviderService[] = fixtureServices.filter((s) =>
  c1DoctorIds.has(s.doctorId),
);

export const initialProviderSlots: ProviderSlot[] = fixtureScheduleSlots.filter((s) => c1DoctorIds.has(s.doctorId));

export const initialProviderBookings: ProviderBooking[] = fixtureBookings.filter((b) => b.clinicId === "c1");
