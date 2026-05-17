const WALLET_TX_TYPES = Object.freeze({
  TOP_UP: "top_up",
  BOOKING_PAYMENT: "booking_payment",
  BOOKING_REFUND: "booking_refund",
  ADMIN_ADJUSTMENT: "admin_adjustment",
});

const REFERENCE_TYPES = Object.freeze({
  BOOKING: "booking",
});

const MOCK_GATEWAYS = Object.freeze({
  INSTANT_TOPUP: "mock_instant_topup",
  QPAY_INVOICE: "mock_qpay_invoice",
  WALLET_DEBIT: "mock_wallet_debit",
  WALLET_REFUND: "mock_wallet_refund",
});

module.exports = { WALLET_TX_TYPES, REFERENCE_TYPES, MOCK_GATEWAYS };
