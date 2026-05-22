export type ServiceCategorySelection =
  | { kind: "all" }
  | { kind: "audience"; id: string; label: string; searchQuery: string }
  | { kind: "specialty"; id: string; label: string; keywords: string[] }
  /** @deprecated provider API ангилал — specialty ашиглана */
  | { kind: "provider"; name: string };
