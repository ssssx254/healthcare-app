/** Эмчийн мэдээлэл. */
export type Doctor = {
  id: string;
  clinicId: string;
  name: string;
  specialty: string;
  title?: string;
  primaryFocus?: string;
  subSpecialty?: string;
  experienceYears?: number;
  phone?: string;
  imageUrl?: string;
  education?: string;
  workExperience?: string;
  licenseInfo?: string;
  supportsOnlineConsultation?: boolean;
  supportsAmbulatoryConsultation?: boolean;
  bio: string;
  averageRating?: number | null;
  reviewCount?: number;
};
