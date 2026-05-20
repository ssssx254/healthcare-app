export type LabTestStatus = "submitted" | "completed" | "reviewed";

export const labTestStatusLabel: Record<LabTestStatus, string> = {
  submitted: "Илгээсэн",
  completed: "Хариу орсон",
  reviewed: "Шалгасан",
};

export function labTestStatusTone(status: LabTestStatus): "neutral" | "warning" | "success" {
  if (status === "reviewed") return "success";
  if (status === "completed") return "warning";
  return "neutral";
}
