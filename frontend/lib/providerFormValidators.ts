/** Эмнэлгийн утас — backend-тай ойролцоо (8–15 орон). */
export function validatePhoneMn(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits.length) return "Утасны дугаар оруулна уу.";
  if (digits.length < 8 || digits.length > 15) return "Утасны дугаар 8–15 оронтой байх ёстой.";
  return null;
}

export function validateAddressMn(raw: string): string | null {
  const t = raw.trim();
  if (!t) return "Хаяг оруулна уу.";
  if (t.length < 5) return "Хаяг хамгийн багадаа 5 тэмдэгт байна.";
  if (t.length > 500) return "Хаяг 500 тэмдэгтээс уртгүй байна.";
  return null;
}

export function validateClinicNameMn(raw: string): string | null {
  const t = raw.trim();
  if (!t) return "Эмнэлгийн нэр оруулна уу.";
  if (t.length < 2) return "Нэр хамгийн багадаа 2 тэмдэгт байна.";
  if (t.length > 191) return "Нэр хэт урт байна (хамгийн ихдээ 191 тэмдэгт).";
  return null;
}

export function validateCityMn(raw: string): string | null {
  const t = raw.trim();
  if (!t) return "Хот / байршил оруулна уу.";
  if (t.length > 128) return "Хотын нэр хэт урт байна.";
  return null;
}

export function validateDescriptionMn(raw: string, maxLen: number): string | null {
  const t = raw.trim();
  if (t.length > maxLen) return `Танилцуулга ${maxLen} тэмдэгтээс уртгүй байна.`;
  return null;
}

export function validateDoctorNameMn(raw: string): string | null {
  const t = raw.trim();
  if (!t) return "Овог нэр оруулна уу.";
  if (t.length < 2) return "Нэр хамгийн багадаа 2 тэмдэгт байна.";
  if (t.length > 120) return "Нэр хэт урт байна.";
  return null;
}

export function validateServiceDurationMn(n: number): string | null {
  if (!Number.isFinite(n) || n < 5 || n > 240) return "Үргэлжлэх хугацаа 5–240 минутын хооронд байна.";
  return null;
}

export function validatePriceMntMn(n: number, required: boolean): string | null {
  if (!Number.isFinite(n) || n < 0) return "Үнэ зөв тоо байна уу гэж шалгана уу.";
  if (required && n <= 0) return "Төлбөртэй үйлчилгээнд үнэ 0-ээс их байна.";
  return null;
}

export function validateServiceTitleMn(raw: string): string | null {
  const t = raw.trim();
  if (!t) return "Үйлчилгээний нэр оруулна уу.";
  if (t.length < 2) return "Нэр хамгийн багадаа 2 тэмдэгт байна.";
  if (t.length > 191) return "Нэр хэт урт байна (хамгийн ихдээ 191 тэмдэгт).";
  return null;
}
