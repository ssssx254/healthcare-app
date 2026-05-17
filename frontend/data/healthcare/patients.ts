import type { Patient } from "@/types/healthcare";

export const fixturePatients: Patient[] = [
  {
    id: "pat-1",
    userId: "u-patient-1",
    displayNameMn: "Мөнхбаяр",
    phone: "99110011",
    city: "Улаанбаатар",
    notesMn: "Даралтын өвчтэй — эмийн түүхийг үргэлж авч явдаг.",
  },
  {
    id: "pat-2",
    userId: "u-patient-2",
    displayNameMn: "Сараа",
    phone: "99220022",
    city: "Улаанбаатар",
  },
];
