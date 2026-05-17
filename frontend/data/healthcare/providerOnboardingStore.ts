export type ProviderOnboardingPayload = {
  account: {
    email: string;
    phone: string;
    contactPersonName: string;
  };
  clinic: {
    name: string;
    type: "эмнэлэг" | "төв" | "кабинет" | "зөвлөгөөний төв";
    registrationNumber: string;
    introduction: string;
    logoUrl?: string;
  };
  contact: {
    address: string;
    phone: string;
    email: string;
    workingHours: string;
    cityDistrict: string;
  };
  serviceScope: {
    directions: string;
    hasOnlineConsultation: boolean;
    hasAmbulatoryCare: boolean;
  };
};

type ProviderApprovalState = {
  email: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
};

const approvals: ProviderApprovalState[] = [];

export function submitProviderOnboarding(payload: ProviderOnboardingPayload): ProviderApprovalState {
  const next: ProviderApprovalState = {
    email: payload.account.email.trim().toLowerCase(),
    status: "pending",
    submittedAt: new Date().toISOString(),
  };
  const idx = approvals.findIndex((x) => x.email === next.email);
  if (idx >= 0) approvals[idx] = next;
  else approvals.unshift(next);
  return next;
}

export function getProviderApprovalStatusByEmail(email?: string | null): ProviderApprovalState["status"] | undefined {
  const key = email?.trim().toLowerCase();
  if (!key) return undefined;
  return approvals.find((x) => x.email === key)?.status;
}

