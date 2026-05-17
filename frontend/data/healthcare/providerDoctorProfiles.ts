export type ProviderDoctorOnboardingProfile = {
  doctorId: string;
  title: string;
  primaryFocus: string;
  subSpecialty: string;
  education: string;
  workExperience: string;
  licenseInfo: string;
  imageUrl?: string;
  supportsOnlineConsultation: boolean;
  supportsAmbulatoryConsultation: boolean;
  workingDays: string[];
  dayTimeRange: string;
  breakTime: string;
};

const profiles = new Map<string, ProviderDoctorOnboardingProfile>();

export function upsertProviderDoctorProfile(profile: ProviderDoctorOnboardingProfile) {
  profiles.set(profile.doctorId, profile);
}

export function getProviderDoctorProfile(doctorId: string) {
  return profiles.get(doctorId);
}

