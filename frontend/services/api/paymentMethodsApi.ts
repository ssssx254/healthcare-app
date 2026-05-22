import { apiRequest, ApiError } from "@/lib/api/client";

export type CardBrand = "visa" | "mastercard";

export type PaymentMethodRow = {
  id: number;
  user_id: number;
  card_brand: CardBrand;
  card_last4: string;
  card_holder_name: string;
  expiry_month: number;
  expiry_year: number;
  is_default: number | boolean;
  created_at: string;
  updated_at: string;
};

export type CreatePaymentMethodBody = {
  card_holder_name: string;
  card_last4: string;
  expiry_month: number;
  expiry_year: number;
  card_brand: CardBrand;
  is_default?: boolean;
};

export function formatCardBrand(brand: CardBrand): string {
  return brand === "visa" ? "Visa" : "Mastercard";
}

export function formatCardMask(row: Pick<PaymentMethodRow, "card_brand" | "card_last4">): string {
  return `${formatCardBrand(row.card_brand)} •••• ${row.card_last4}`;
}

function unwrapList(data: PaymentMethodRow[] | { items: PaymentMethodRow[] }): PaymentMethodRow[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && Array.isArray(data.items)) return data.items;
  return [];
}

async function requestPaymentMethods<T>(
  path: string,
  options: Parameters<typeof apiRequest<T>>[1],
): Promise<T> {
  try {
    return await apiRequest<T>(path, options);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404 && path.startsWith("/payment-methods")) {
      const alt = path.replace("/payment-methods", "/wallet/payment-methods");
      return apiRequest<T>(alt, options);
    }
    if (e instanceof ApiError && e.status === 404) {
      throw new ApiError(
        "Төлбөрийн картын API олдсонгүй. Backend шинэчлээд 013 migration ажиллуулна уу (эсвэл локал API ашиглана).",
        404,
      );
    }
    throw e;
  }
}

export const paymentMethodsApi = {
  async list(): Promise<PaymentMethodRow[]> {
    const data = await requestPaymentMethods<PaymentMethodRow[] | { items: PaymentMethodRow[] }>(
      "/payment-methods",
      { method: "GET" },
    );
    return unwrapList(data);
  },

  create(body: CreatePaymentMethodBody): Promise<PaymentMethodRow> {
    return requestPaymentMethods<PaymentMethodRow>("/payment-methods", { method: "POST", json: body });
  },

  setDefault(id: number): Promise<PaymentMethodRow> {
    return requestPaymentMethods<PaymentMethodRow>(`/payment-methods/${id}/default`, { method: "PATCH" });
  },

  remove(id: number): Promise<{ deleted: boolean }> {
    return requestPaymentMethods<{ deleted: boolean }>(`/payment-methods/${id}`, { method: "DELETE" });
  },
};
