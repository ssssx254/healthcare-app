/**
 * "10:00 – 11:30" эсвэл "10:00-11:30" мөрнөөс эхлэл/төгсгөлийн цаг гаргана (HH:mm:ss).
 */
export function parseTimeRangeFromLabel(label: string): { start: string; end: string } | null {
  const normalized = label.replace(/\u2013/g, "-").trim();
  const m = normalized.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
  if (!m) return null;
  return { start: toHms(m[1]!), end: toHms(m[2]!) };
}

function toHms(clock: string): string {
  const t = clock.trim();
  if (/^\d{2}:\d{2}:\d{2}$/.test(t)) return t;
  const hm = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (!hm) return `${t}:00`;
  const hh = hm[1]!.padStart(2, "0");
  const mm = hm[2]!;
  return `${hh}:${mm}:00`;
}

/** Огноо YYYY-MM-DD — календарийн бодит өдөр эсэхийг шалгана. */
export function validateDateIsoMn(raw: string): string | null {
  const t = raw.trim();
  if (!t) return "Огноо оруулна уу.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return "Огноо YYYY-MM-DD хэлбэртэй оруулна уу.";
  const [y, mo, da] = t.split("-").map((x) => Number(x));
  if (![y, mo, da].every((n) => Number.isInteger(n))) return "Огноо буруу байна.";
  const d = new Date(Date.UTC(y, mo - 1, da));
  if (d.getUTCFullYear() !== y || d.getUTCMonth() !== mo - 1 || d.getUTCDate() !== da) return "Огноо буруу байна.";
  return null;
}

export function minutesFromHms(hms: string): number | null {
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(hms.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  const s = m[3] != null ? Number(m[3]) : 0;
  if (![h, min, s].every((n) => Number.isFinite(n))) return null;
  if (h < 0 || h > 23 || min < 0 || min > 59 || s < 0 || s > 59) return null;
  return h * 3600 + min * 60 + s;
}

/** Эхлэл ба төгсгөлийн цаг HH:mm:ss — эхлэл нь төгсгөлөөс өмнө байх ёстой. */
export function validateStartBeforeEndHms(start: string, end: string): string | null {
  const a = minutesFromHms(start);
  const b = minutesFromHms(end);
  if (a == null || b == null) return null;
  if (a >= b) return "Эхлэх цаг дуусах цагаас өмнө байх ёстой.";
  return null;
}
