import type { AuthUser, UserRole } from "@/types";

export type MockAuthPayload = {
  email: string;
  password: string;
  role: UserRole;
  name?: string;
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function mockSignIn(payload: MockAuthPayload): Promise<AuthUser> {
  await wait(600);
  return {
    id: `mock-${Date.now()}`,
    name: payload.name?.trim() || "Хэрэглэгч",
    email: payload.email.trim(),
    role: payload.role,
  };
}

export async function mockSignUp(payload: MockAuthPayload): Promise<AuthUser> {
  await wait(700);
  return {
    id: `mock-${Date.now()}`,
    name: payload.name?.trim() || "Шинэ хэрэглэгч",
    email: payload.email.trim(),
    role: payload.role,
  };
}