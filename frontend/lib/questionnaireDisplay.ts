/** Анкетын JSON-оос UI-д харуулах товч текст үүсгэнэ. */
export function answersJsonToSummary(raw: unknown): string {
  if (raw == null) return "";
  let obj: Record<string, unknown>;
  if (typeof raw === "string") {
    try {
      obj = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return raw;
    }
  } else if (typeof raw === "object" && !Array.isArray(raw)) {
    obj = raw as Record<string, unknown>;
  } else {
    return String(raw);
  }
  const lines: string[] = [];
  const order = ["symptoms", "chronicIllness", "medications", "allergies"];
  const labels: Record<string, string> = {
    symptoms: "Шинж тэмдэг",
    chronicIllness: "Өвчин",
    medications: "Эм",
    allergies: "Харшил",
  };
  for (const key of order) {
    const v = obj[key];
    if (v === undefined || v === null || v === "") continue;
    const label = labels[key] ?? key;
    lines.push(`${label}: ${String(v)}`);
  }
  for (const key of Object.keys(obj)) {
    if (order.includes(key)) continue;
    const v = obj[key];
    if (v === undefined || v === null || v === "") continue;
    lines.push(`${key}: ${String(v)}`);
  }
  return lines.join("\n");
}
