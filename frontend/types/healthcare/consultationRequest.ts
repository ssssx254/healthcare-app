/** Онлайн зөвлөгөөний хүсэлт (захиалгаас тусдаа эсвэл урьдчилсан хүсэлт). */
export type ConsultationRequestStatus = "pending" | "in_review" | "answered" | "closed";

export type ConsultationRequest = {
  id: string;
  createdAtIso: string;
  clinicId: string;
  clinicNameMn: string;
  doctorId: string;
  doctorNameMn: string;
  patientNameMn: string;
  topicMn: string;
  messageMn: string;
  status: ConsultationRequestStatus;
};
