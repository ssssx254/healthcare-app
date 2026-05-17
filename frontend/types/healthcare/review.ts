/** Эмч эсвэл эмнэлгийн үнэлгээ. */
export type Review = {
  id: string;
  clinicId: string;
  doctorId: string;
  patientNameMn: string;
  rating: 1 | 2 | 3 | 4 | 5;
  commentMn: string;
  createdAtIso: string;
};
