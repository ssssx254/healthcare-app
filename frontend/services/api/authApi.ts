import { apiRequest } from "@/lib/api/client";

export type BackendUser = {
  id: number;
  full_name: string;
  email: string;
  role: "customer" | "provider" | "system_admin";
  onboarding_status?: "pending" | "approved" | "rejected";
  phone?: string | null;
  created_at?: string;
};

export type LoginResponse = {
  user: BackendUser;
  token: string;
  role: "customer" | "provider" | "system_admin";
};

export type RegisterBody = {
  full_name: string;
  email: string;
  password: string;
  role: "customer" | "provider" | "system_admin";
  phone?: string | null;
};

export const authApi = {
  login(body: { identifier: string; password: string }): Promise<LoginResponse> {
    return apiRequest<LoginResponse>("/auth/login", { method: "POST", json: body });
  },

  register(body: RegisterBody): Promise<LoginResponse> {
    return apiRequest<LoginResponse>("/auth/register", { method: "POST", json: body });
  },

  me(): Promise<BackendUser> {
    return apiRequest<BackendUser>("/auth/me", { method: "GET" });
  },
};

export async function loginUser(params: { identifier: string; password: string }): Promise<LoginResponse> {
  return authApi.login(params);
}

export async function registerUser(body: RegisterBody): Promise<LoginResponse> {
  return authApi.register(body);
}

/** Backend `forgotPassword`: бүртгэл байвал `reset_token` (имэйл илгээхгүй бол шууд дараагийн дэлгэцэд ашиглана). */
export type ForgotPasswordResponse = {
  success: true;
  message: string;
  reset_token?: string;
};

export async function forgotPasswordRequest(identifier: string): Promise<ForgotPasswordResponse> {
  const value = identifier.trim();
  if (!value) {
    throw new Error("Имэйл эсвэл утасны дугаар оруулна уу.");
  }
  return apiRequest<ForgotPasswordResponse>("/auth/forgot-password", {
    method: "POST",
    json: { identifier: value },
  });
}

export async function resetPassword(params: { token: string; newPassword: string }): Promise<{ success: true; message: string }> {
  const token = params.token.trim();
  const newPassword = params.newPassword.trim();
  if (!token || !newPassword) {
    throw new Error("Сэргээх мэдээлэл дутуу байна.");
  }
  return apiRequest<{ success: true; message: string }>("/auth/reset-password", {
    method: "POST",
    json: { token, new_password: newPassword },
  });
}
