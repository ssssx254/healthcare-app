export type MeetingPlatform = "google_meet" | "zoom" | "teams" | "other";

/** Онлайн уулзалтын холбоосын бүртгэл. */
export type MeetingLink = {
  id: string;
  bookingId: string;
  url: string;
  platform: MeetingPlatform;
  createdAtIso: string;
  expiresAtIso?: string;
  noteMn?: string;
};
