/** Үйлчилгээний ангилал. */
export type ServiceCategory = {
  id: string;
  name: string;
  /** Хэрэв заавал бол эмнэлэг тус бүрт өөрийн ангилал байна. */
  clinicId?: string;
};
