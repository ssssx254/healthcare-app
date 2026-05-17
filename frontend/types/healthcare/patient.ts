/** Үйлчлүүлэгчийн профайл (өвчтөний тал). */
export type Patient = {
  id: string;
  userId: string;
  displayNameMn: string;
  phone?: string;
  city?: string;
  notesMn?: string;
};
