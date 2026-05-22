/**
 * Хэрэглэгчид харуулах сүлжээ / HTTP алдааны мессежийг ойлгомжтой монгол болгоно.
 * Аль хэдийн монгол эсвэл тодорхой мессеж бол өөрчлөхгүй.
 */
export function toFriendlyErrorMn(message: string): string {
  const raw = message.trim();
  if (!raw) return "Тодорхойгүй алдаа гарлаа. Дахин оролдоно уу.";

  const lower = raw.toLowerCase();

  if (
    lower.includes("network request failed") ||
    lower.includes("failed to fetch") ||
    lower.includes("network error") ||
    lower === "load failed" ||
    lower.includes("fetch failed")
  ) {
    return "Сүлжээтэй холбогдож чадсангүй. Интернэт, VPN эсвэл серверийн ажиллагааг шалгаад дахин оролдоно уу.";
  }
  if (lower.includes("timeout") || lower.includes("timed out")) {
    return "Хүсэлт хэт удаан үргэлжилсэн. Дахин оролдоно уу.";
  }
  if (lower.includes("401") || lower.includes("unauthorized")) {
    return "Нэвтрэх эрх дууссан эсвэл буруу байна. Дахин нэвтэрнэ үү.";
  }
  if (lower.includes("403") || lower.includes("forbidden")) {
    return "Энэ үйлдлийг хийх эрх байхгүй байна.";
  }
  if (lower.includes("зам олдсонгүй")) {
    return "Серверийн API зам олдсонгүй. Backend (Render) дээр шинэ код deploy хийсний дараа дахин оролдоно уу.";
  }
  if (lower.includes("404") || lower.includes("not found")) {
    return "Хүссэн мэдээлэл олдсонгүй.";
  }
  if (lower.includes("429") || lower.includes("rate limit")) {
    return "Хэт олон хүсэлт илгээгдлээ. Хэдэн секундын дараа дахин оролдоно уу.";
  }
  if (lower.includes("500") || lower.includes("502") || lower.includes("503") || lower.includes("internal server")) {
    return "Серверийн алдаа гарлаа. Түр хүлээгээд дахин оролдоно уу.";
  }

  return raw;
}
