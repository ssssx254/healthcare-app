import type { HealthQuestionnaire, HealthQuestionnaireSubmission } from "@/types/healthcare";

/** Үйлчлүүлэгчийн анкетын үлгэр асуултууд. */
export const fixtureDefaultHealthQuestionnaire: HealthQuestionnaire = {
  id: "hq-default",
  titleMn: "Эрүүл мэндийн анкет",
  descriptionMn: "Захиалгын өмнөх ерөнхий мэдээлэл — эмчид тусална.",
  questions: [
    {
      id: "hq-q1",
      promptMn: "Одоогийн гол шинж тэмдэг юу вэ?",
      type: "text",
      required: true,
    },
    {
      id: "hq-q2",
      promptMn: "Өмнө нь оношлогдсон өвчин байна уу?",
      type: "text",
      required: false,
    },
    {
      id: "hq-q3",
      promptMn: "Тогтмол ууж байгаа эм бэлдмэлүүдийг бичнэ үү.",
      type: "text",
      required: false,
    },
    {
      id: "hq-q4",
      promptMn: "Харшил, хор хөнөөлтэй эмийн түүх байна уу?",
      type: "single",
      optionsMn: ["Тийм", "Үгүй", "Мэдэхгүй"],
      required: true,
    },
    {
      id: "hq-q5",
      promptMn: "Өвчтөний ангилал (сонгоно уу)",
      type: "multi",
      optionsMn: ["Насанд хүрэгч", "Хүүхэд", "Жирэмсэн"],
      required: false,
    },
  ],
};

export const fixtureQuestionnaireSubmissions: HealthQuestionnaireSubmission[] = [
  {
    id: "hqs-1",
    questionnaireId: "hq-default",
    bookingId: "ord-sample-2",
    patientNameMn: "Нараа",
    submittedAtIso: "2026-04-12T10:55:00.000Z",
    answers: [
      { questionId: "hq-q1", valueMn: "Толгой өвдөж, нухраас дарагдана." },
      { questionId: "hq-q2", valueMn: "Даралтын өвчин — эмчээр хянагддаг." },
      { questionId: "hq-q3", valueMn: "Амлодипин 5мг өдөрт 1." },
      { questionId: "hq-q4", valueMn: "Үгүй" },
      { questionId: "hq-q5", valueMn: "Насанд хүрэгч" },
    ],
  },
];
