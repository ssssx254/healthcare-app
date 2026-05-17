import type { MeetingLink } from "@/types/healthcare";

export const fixtureMeetingLinks: MeetingLink[] = [
  {
    id: "ml-1",
    bookingId: "ord-sample-1",
    url: "https://meet.example.com/free-1",
    platform: "google_meet",
    createdAtIso: "2026-04-10T09:50:00.000Z",
    noteMn: "Үнэгүй зөвлөгөө",
  },
  {
    id: "ml-2",
    bookingId: "ord-sample-4",
    url: "https://meet.example.com/abc",
    platform: "zoom",
    createdAtIso: "2026-04-15T08:45:00.000Z",
  },
];
