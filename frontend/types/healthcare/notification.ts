export type NotificationAudience = "customer" | "provider";

export type Notification = {
  id: string;
  titleMn: string;
  bodyMn: string;
  timeLabelMn: string;
  audience: NotificationAudience;
  read?: boolean;
  tone?: "brand" | "neutral" | "success" | "warning";
};
