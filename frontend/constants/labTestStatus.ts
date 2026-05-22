export type LabTestStatus = "submitted" | "completed" | "reviewed";
export type LabUploadedBy = "customer" | "clinic";

/** Амжилттай хадгалах / илгээх мессежүүд */
export const labTestSuccessMessage = {
  customerSaved: "Шинжилгээ хадгалагдлаа",
  providerResultSent: "Шинжилгээний хариу илгээгдлээ",
  providerSaved: "Хадгалагдлаа",
  providerReviewed: "Шалгасан боллоо",
} as const;

/** Эх үүсвэр (жагсаалт, дэлгэрэнгүй) */
export function getLabTestSourceLabel(uploadedBy: LabUploadedBy): string {
  return uploadedBy === "clinic" ? "Эмнэлгээс ирсэн" : "Миний бүртгэл";
}

/**
 * Төлөвийн шошго — үйлчлүүлэгч өөрөө нэмсэнд «Илгээсэн» ашиглахгүй.
 */
export function getLabTestStatusLabel(status: LabTestStatus, uploadedBy: LabUploadedBy): string {
  if (uploadedBy === "clinic") {
    if (status === "reviewed") return "Шалгасан";
    if (status === "completed") return "Хариу орсон";
    return "Эмнэлгээс ирсэн";
  }
  switch (status) {
    case "submitted":
      return "Хадгалагдсан";
    case "completed":
      return "Хариу орсон";
    case "reviewed":
      return "Шалгасан";
    default:
      return "Хадгалагдсан";
  }
}

export function labTestStatusTone(
  status: LabTestStatus,
  uploadedBy?: LabUploadedBy,
): "brand" | "neutral" | "warning" | "success" {
  if (status === "reviewed") return "success";
  if (status === "completed") return "warning";
  if (uploadedBy === "clinic" && status === "submitted") return "brand";
  return "neutral";
}
