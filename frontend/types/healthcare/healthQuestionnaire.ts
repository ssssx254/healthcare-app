export type HealthQuestionnaireQuestionType = "text" | "single" | "multi";

/** Анкетын нэг асуулт. */
export type HealthQuestionnaireQuestion = {
  id: string;
  promptMn: string;
  type: HealthQuestionnaireQuestionType;
  optionsMn?: string[];
  required: boolean;
};

/** Нэг асуултын хариулт. */
export type HealthQuestionnaireAnswer = {
  questionId: string;
  valueMn: string;
};

/** Анкетын загвар (асуултуудын багц). */
export type HealthQuestionnaire = {
  id: string;
  titleMn: string;
  descriptionMn?: string;
  questions: HealthQuestionnaireQuestion[];
};

/** бөглөсөн анкетын жишээ (захиалгатай холбогдох боломжтой). */
export type HealthQuestionnaireSubmission = {
  id: string;
  questionnaireId: string;
  bookingId?: string;
  patientNameMn: string;
  submittedAtIso: string;
  answers: HealthQuestionnaireAnswer[];
};
