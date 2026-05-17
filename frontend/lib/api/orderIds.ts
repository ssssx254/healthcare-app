/** Үнэгүй зөвлөгөөний хүсэлт (`consultation_requests`) — захиалгын ID-аас ялгах. */
export const CONSULTATION_ORDER_PREFIX = "c-";

export function isConsultationOrderId(orderId: string): boolean {
  return orderId.startsWith(CONSULTATION_ORDER_PREFIX);
}

export function consultationNumericId(orderId: string): number {
  return Number(orderId.slice(CONSULTATION_ORDER_PREFIX.length));
}

export function toConsultationOrderId(numericId: number): string {
  return `${CONSULTATION_ORDER_PREFIX}${numericId}`;
}
