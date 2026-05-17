import { apiRequest, apiRequestPaginated } from "@/lib/api/client";
import { withQuery } from "@/lib/api/query";
import type { ApiPaginatedData } from "@/types/api/envelope";

export type WalletBalance = { user_id: number; balance: number; currency: string };

export type WalletTransactionRow = {
  id: number;
  user_id: number;
  direction: "credit" | "debit";
  amount: number | string;
  balance_after: number | string;
  transaction_type: string;
  reference_type?: string | null;
  reference_id?: number | null;
  gateway_ref?: string | null;
  metadata?: unknown;
  created_at: string;
};

export type WalletTxListParams = {
  page?: number;
  page_size?: number;
  transaction_type?: string;
};

/** Backend `POST /wallet/qpay/invoice` (жишээ QPay). */
export type QpayInvoiceResponse = {
  invoice_id: string;
  amount_mnt: number;
  currency: string;
  qr_payload: string;
  deep_link_mock: string;
  expires_at: string;
  polling_hint_mn: string;
};

export const walletApi = {
  balance(): Promise<WalletBalance> {
    return apiRequest<WalletBalance>("/wallet/balance", { method: "GET" });
  },

  topUp(body: { amount: number; mock_gateway?: string; payment_method_id?: number | null; note?: string | null }): Promise<{
    wallet: { balance: number; currency: string };
    transaction: WalletTransactionRow;
  }> {
    return apiRequest("/wallet/top-up", { method: "POST", json: body });
  },

  qpayCreateInvoice(body: { amount: number }): Promise<QpayInvoiceResponse> {
    return apiRequest("/wallet/qpay/invoice", { method: "POST", json: body });
  },

  qpayConfirm(body: { invoice_id: string }): Promise<{
    wallet: { balance: number; currency: string };
    transaction: WalletTransactionRow;
  }> {
    return apiRequest("/wallet/qpay/confirm", { method: "POST", json: body });
  },

  transactionsPaged(params?: WalletTxListParams): Promise<ApiPaginatedData<WalletTransactionRow>> {
    return apiRequestPaginated<WalletTransactionRow>(withQuery("/wallet/transactions", params ?? {}));
  },

  listPaymentMethods(): Promise<unknown[]> {
    return apiRequest<unknown[]>("/wallet/payment-methods", { method: "GET" });
  },

  createPaymentMethod(body: Record<string, unknown>): Promise<Record<string, unknown>> {
    return apiRequest("/wallet/payment-methods", { method: "POST", json: body });
  },

  payBooking(booking_id: number): Promise<unknown> {
    return apiRequest("/wallet/pay-booking", { method: "POST", json: { booking_id } });
  },
};
