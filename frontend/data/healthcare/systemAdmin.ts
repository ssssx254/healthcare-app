export type AdminClinicReviewItem = {
  id: string;
  clinicName: string;
  ownerName: string;
  city: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
};

export type AdminProviderAccount = {
  id: string;
  name: string;
  email: string;
  clinicName: string;
  status: "active" | "suspended";
};

export type AdminReportItem = {
  id: string;
  type: "clinic" | "doctor" | "article";
  targetName: string;
  reason: string;
  submittedAt: string;
  status: "open" | "resolved";
};

export const adminClinicReviewQueue: AdminClinicReviewItem[] = [
  {
    id: "rev-001",
    clinicName: "Энхжаргал эмнэлэг",
    ownerName: "Б. Энхжин",
    city: "Улаанбаатар",
    submittedAt: "2026-04-21",
    status: "pending",
  },
  {
    id: "rev-002",
    clinicName: "Сэргээх төв",
    ownerName: "Д. Төгөлдөр",
    city: "Дархан",
    submittedAt: "2026-04-20",
    status: "pending",
  },
];

export function addAdminClinicReview(item: Omit<AdminClinicReviewItem, "id" | "submittedAt" | "status">) {
  adminClinicReviewQueue.unshift({
    id: `rev-${Date.now()}`,
    clinicName: item.clinicName,
    ownerName: item.ownerName,
    city: item.city,
    submittedAt: new Date().toISOString().slice(0, 10),
    status: "pending",
  });
}

export const adminProviderAccounts: AdminProviderAccount[] = [
  {
    id: "pro-001",
    name: "Н. Мөнх-Эрдэнэ",
    email: "munkh@turshilt.mn",
    clinicName: "Энх эмнэлэг",
    status: "active",
  },
  {
    id: "pro-002",
    name: "Ц. Номин",
    email: "nomin@turshilt.mn",
    clinicName: "Итгэлт клиник",
    status: "suspended",
  },
];

export const adminReportQueue: AdminReportItem[] = [
  {
    id: "rep-001",
    type: "article",
    targetName: "Чихрийн шижинтэй үед хооллолт",
    reason: "Буруу мэдээлэл байж болзошгүй",
    submittedAt: "2026-04-22",
    status: "open",
  },
  {
    id: "rep-002",
    type: "clinic",
    targetName: "Төв клиник",
    reason: "Профайл дахь мэдээлэл зөрүүтэй",
    submittedAt: "2026-04-21",
    status: "open",
  },
];

