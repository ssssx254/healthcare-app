import type { ConsultationRequest } from "@/types/healthcare";

export const fixtureConsultationRequests: ConsultationRequest[] = [
  {
    id: "cr1",
    createdAtIso: "2026-04-16T11:00:00.000Z",
    clinicId: "c1",
    clinicNameMn: "Өргөө эмнэлэг",
    doctorId: "d1",
    doctorNameMn: "Доктор Батбаяр",
    patientNameMn: "Алтангэрэл",
    topicMn: "Чихрийн шижингийн хоолны зөвлөгөө",
    messageMn:
      "Сайн байна уу. Өглөөний цусны сахар 7.2 гарч байна. Өдөр тутмын хоолны жишээ цэс авмаар байна.",
    status: "pending",
  },
  {
    id: "cr2",
    createdAtIso: "2026-04-15T14:20:00.000Z",
    clinicId: "c1",
    clinicNameMn: "Өргөө эмнэлэг",
    doctorId: "d2",
    doctorNameMn: "Доктор Сараа",
    patientNameMn: "Энхмаа",
    topicMn: "Хүүхдийн дархлаажуулалт",
    messageMn: "6 сартай — B вакцин хойшлуулах боломжтой юу, эсвэл товлосон өдөр очих уу?",
    status: "in_review",
  },
  {
    id: "cr3",
    createdAtIso: "2026-04-10T09:00:00.000Z",
    clinicId: "c3",
    clinicNameMn: "Сэргэн мэндийн төв",
    doctorId: "d5",
    doctorNameMn: "Доктор Ганзориг",
    patientNameMn: "Бат-Эрдэнэ",
    topicMn: "Нурууны өвдөлт — дасгал",
    messageMn: "Өдөр бүр оффист суудаг. Дунд хэсэгт өвдөлт үүсдэг. Гэрт хийх дасгалын видео холбоос байна уу?",
    status: "answered",
  },
];
