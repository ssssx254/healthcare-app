const { AppError } = require("../utils/appError");
const { assertPositiveIntId } = require("../utils/validation");
const { isPaymentChannel } = require("../constants/paymentMethods");

function toMoney(n) {
  const x = Number(n);
  if (Number.isNaN(x) || x <= 0) return null;
  return Math.round(x * 100) / 100;
}

function assertTopUpAmount(body, field = "amount") {
  const amount = toMoney(body[field]);
  if (!amount || amount < 1) {
    throw new AppError(400, "Цэнэглэх дүн 1-ээс их байна.");
  }
  if (amount > 50_000_000) {
    throw new AppError(400, "Нэг удаагийн дүн хэт их байна.");
  }
  return amount;
}

function validatePayBookingBody(body) {
  const booking_id = body.booking_id ?? body.bookingId;
  if (booking_id === undefined || booking_id === null || booking_id === "") {
    throw new AppError(400, "booking_id оруулна уу.");
  }
  const channel = body.channel != null && body.channel !== "" ? String(body.channel).trim() : "wallet";
  if (!isPaymentChannel(channel)) {
    throw new AppError(400, "channel: wallet, qpay, saved_card байна.");
  }
  const out = {
    booking_id: assertPositiveIntId(booking_id, "booking_id"),
    channel,
  };
  if (body.payment_method_id != null && body.payment_method_id !== "") {
    out.payment_method_id = assertPositiveIntId(body.payment_method_id, "payment_method_id");
  }
  if (body.qpay_invoice_id != null && String(body.qpay_invoice_id).trim() !== "") {
    out.qpay_invoice_id = String(body.qpay_invoice_id).trim();
  }
  return out;
}

function validateQpayBookingInvoiceBody(body) {
  const booking_id = body.booking_id ?? body.bookingId;
  return { booking_id: assertPositiveIntId(booking_id, "booking_id") };
}

function validateQpayInvoiceBody(body) {
  return { amount: assertTopUpAmount(body, "amount") };
}

function validateQpayConfirmBody(body) {
  const invoice_id = body.invoice_id ?? body.invoiceId;
  if (invoice_id === undefined || invoice_id === null || String(invoice_id).trim() === "") {
    throw new AppError(400, "Нэхэмжлэлийн дугаар (invoice_id) оруулна уу.");
  }
  return { invoice_id: String(invoice_id).trim() };
}

module.exports = {
  validatePayBookingBody,
  validateQpayInvoiceBody,
  validateQpayConfirmBody,
  validateQpayBookingInvoiceBody,
};
