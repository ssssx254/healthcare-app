const CARD_BRANDS = Object.freeze(["visa", "mastercard"]);

const PAYMENT_CHANNELS = Object.freeze({
  WALLET: "wallet",
  QPAY: "qpay",
  SAVED_CARD: "saved_card",
});

const PAYMENT_ATTEMPT_STATUS = Object.freeze({
  PENDING: "pending",
  PAID: "paid",
  FAILED: "failed",
  CANCELLED: "cancelled",
});

function isCardBrand(v) {
  return CARD_BRANDS.includes(String(v || "").toLowerCase());
}

function isPaymentChannel(v) {
  return Object.values(PAYMENT_CHANNELS).includes(v);
}

function isPaymentAttemptStatus(v) {
  return Object.values(PAYMENT_ATTEMPT_STATUS).includes(v);
}

module.exports = {
  CARD_BRANDS,
  PAYMENT_CHANNELS,
  PAYMENT_ATTEMPT_STATUS,
  isCardBrand,
  isPaymentChannel,
  isPaymentAttemptStatus,
};
