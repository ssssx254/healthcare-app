import { apiRequest, apiRequestPaginated } from "@/lib/api/client";
import { withQuery } from "@/lib/api/query";
import type { PaymentAttemptStatus } from "@/constants/paymentStatus";
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

export type PaymentChannel = "wallet" | "qpay" | "saved_card";

export type PayBookingBody = {
  booking_id: number;
  channel?: PaymentChannel;
  payment_method_id?: number;
  qpay_invoice_id?: string;
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
  payment_status?: PaymentAttemptStatus;
  booking_id?: number;
};

export const walletApi = {
  balance(): Promise<WalletBalance> {
    return apiRequest<WalletBalance>("/wallet/balance", { method: "GET" });
  },

  topUp(body: {
    amount: number;
    mock_gateway?: string;
    payment_method_id?: number | null;
    note?: string | null;
  }): Promise<{
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

  qpayBookingInvoice(body: { booking_id: number }): Promise<QpayInvoiceResponse> {
    return apiRequest("/wallet/qpay/booking-invoice", { method: "POST", json: body });
  },

  qpayBookingConfirm(body: { invoice_id: string }): Promise<{
    booking: Record<string, unknown>;
    payment_status: PaymentAttemptStatus;
  }> {
    return apiRequest("/wallet/qpay/booking-confirm", { method: "POST", json: body });
  },

  transactionsPaged(params?: WalletTxListParams): Promise<ApiPaginatedData<WalletTransactionRow>> {
    return apiRequestPaginated<WalletTransactionRow>(withQuery("/wallet/transactions", params ?? {}));
  },

  payBooking(body: PayBookingBody): Promise<Record<string, unknown>> {
    return apiRequest("/wallet/pay-booking", { method: "POST", json: body });
  },
};
