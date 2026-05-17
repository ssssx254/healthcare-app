import type { Doctor } from "@/types/healthcare";

export const fixtureDoctors: Doctor[] = [
  {
    id: "d1",
    clinicId: "c1",
    name: "Доктор Батбаяр",
    specialty: "Дотоодын өвчин",
    experienceYears: 14,
    phone: "88112233",
    bio: "Чихрийн шижин, даралт, элэгний өвчний чиглэлээр зөвлөдөнө. Олон улсын сургалттай.",
  },
  {
    id: "d2",
    clinicId: "c1",
    name: "Доктор Сараа",
    specialty: "Хүүхдийн эмч",
    experienceYears: 9,
    phone: "88223344",
    bio: "Хүүхдийн халуурал, дэгдэлт, өсөлтийн үнэлгээ, дархлаажуулалтын төлөвлөгөө.",
  },
  {
    id: "d3",
    clinicId: "c2",
    name: "Доктор Энхтуяа",
    specialty: "Ерөнхий эмч",
    experienceYears: 11,
    phone: "88334455",
    bio: "Ерөнхий оношлогоо, урьдчилан сэргийлэлт, гэр бүлийн эрүүл мэндийн удирдлага.",
  },
  {
    id: "d4",
    clinicId: "c1",
    name: "Доктор Оюунаа",
    specialty: "Зүрх судас",
    experienceYears: 16,
    phone: "88445566",
    bio: "Даралт, зүрхний хэм алдагдал, судасны эрсдэлийн үнэлгээ.",
  },
  {
    id: "d5",
    clinicId: "c3",
    name: "Доктор Ганзориг",
    specialty: "Реабилитаци, физиотерапи",
    experienceYears: 12,
    phone: "88556677",
    bio: "Нуруу-нугасны өвдөлт, мөргөцөгний сэргээлт, спортын гэмтэлийн дараах сэргээлт.",
  },
];
