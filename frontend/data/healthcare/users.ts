import type { User } from "@/types/healthcare";

/** Жишээ хэрэглэгчид (нэвтрэлтийн жишээ өгөгдөлтэй уялдуулж болно). */
export const fixtureUsers: User[] = [
  {
    id: "u-patient-1",
    name: "Мөнхбаяр",
    email: "patient@turshilt.mn",
    phone: "99110011",
    role: "customer",
  },
  {
    id: "u-provider-1",
    name: "Эмнэлгийн админ",
    email: "clinic@orgoo.mn",
    phone: "7000-1001",
    role: "provider",
  },
  {
    id: "u-patient-2",
    name: "Сараа",
    email: "saraa@turshilt.mn",
    phone: "99220022",
    role: "customer",
  },
  {
    id: "u-provider-2",
    name: "Гэр бүлийн эмнэлгийн админ",
    email: "medeelel@geriin-emneg.mn",
    role: "provider",
  },
];
