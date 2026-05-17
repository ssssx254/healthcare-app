import type { UserRole } from "../roles";

/** Платформын хэрэглэгчийн бүртгэл (нэвтрэлтийн үндсэн мэдээлэл). */
export type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  approvalStatus?: "pending" | "approved" | "rejected";
};

/** @deprecated Нэршлийн зөвлөмж: `User` ашиглана. */
export type AuthUser = User;
