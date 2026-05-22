import { apiRequest } from "@/lib/api/client";

export type ProviderOnboardingSubmitBody = {
  manager_name: string;
  account_email: string;
  account_phone: string;
  clinic_name: string;
  clinic_type: string;
  introduction: string;
  logo_url?: string | null;
  address: string;
  city: string;
  district: string;
  contact_phone: string;
  contact_email: string;
  working_hours: string;
  online_enabled: boolean;
  ambulatory_enabled: boolean;
  supported_specialties: string;
};

export type ProviderOnboardingSubmitResponse = {
  onboarding_status: string;
  submission: unknown;
};

export const providerOnboardingApi = {
  submit(body: ProviderOnboardingSubmitBody): Promise<ProviderOnboardingSubmitResponse> {
    return apiRequest<ProviderOnboardingSubmitResponse>("/provider-onboarding/submit", {
      method: "POST",
      json: body,
    });
  },

  updateLogo(logo_url: string | null): Promise<{ logo_url: string | null }> {
    return apiRequest<{ logo_url: string | null }>("/provider-onboarding/logo", {
      method: "PATCH",
      json: { logo_url },
    });
  },
};
