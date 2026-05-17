const crypto = require("crypto");
const { pool } = require("../config/database");
const { AppError } = require("../utils/appError");
const { assertPositiveIntId } = require("../utils/validation");
const { ROLES } = require("../constants/roles");
const walletRepo = require("../repositories/wallet.repository");
const { WALLET_TX_TYPES, REFERENCE_TYPES, MOCK_GATEWAYS } = require("../constants/wallet");

/** invoice_id -> { userId, amount, expiresAt } — жинхэнэ QPay биш, жишээ урсгал. */
const pendingQpayInvoices = new Map();

function toMoney(n) {
  const x = Number(n);
  if (Number.isNaN(x) || x <= 0) return null;
  return Math.round(x * 100) / 100;
}

function assertCustomer(user) {
  if (!user || user.role !== ROLES.CUSTOMER) {
    throw new AppError(403, "Зөвхөн үйлчлүүлэгч энэ үйлдлийг хийнэ.");
  }
}

async function getWalletBalance(userId) {
  const w = await walletRepo.ensureWallet(null, userId);
  return { user_id: userId, balance: Number(w.balance), currency: w.currency };
}

async function topUpWallet(user, body) {
  assertCustomer(user);
  const amount = toMoney(body.amount);
  if (!amount || amount < 1) {
    throw new AppError(400, "Цэнэглэх дүн 1-ээс их байна.");
  }
  if (amount > 50_000_000) {
    throw new AppError(400, "Нэг удаагийн дүн хэт их байна.");
  }

  const gatewayRef = `${MOCK_GATEWAYS.INSTANT_TOPUP}:${crypto.randomUUID()}`;
  const meta = {
    mock_gateway: body.mock_gateway || "instant",
    payment_method_id: body.payment_method_id ?? null,
    note: body.note ?? null,
  };

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const wallet = await walletRepo.lockWalletForUpdate(conn, user.id);
    const prev = Number(wallet.balance);
    const next = Math.round((prev + amount) * 100) / 100;
    await walletRepo.updateWalletBalance(conn, user.id, next);
    const tx = await walletRepo.insertWalletTransaction(conn, {
      user_id: user.id,
      direction: "credit",
      amount,
      balance_after: next,
      transaction_type: WALLET_TX_TYPES.TOP_UP,
      reference_type: null,
      reference_id: null,
      gateway_ref: gatewayRef,
      metadata: meta,
    });
    await conn.commit();
    return { wallet: { balance: next, currency: wallet.currency }, transaction: tx };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

/**
 * Захиалгын төлбөрийг дансаас хасаж, гүйлгээний түүх бүртгэнэ.
 */
async function payBookingFromWallet(customerUserId, bookingId) {
  const bid = assertPositiveIntId(bookingId, "booking_id");

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [bRows] = await conn.execute(`SELECT * FROM bookings WHERE id = ? FOR UPDATE`, [bid]);
    const booking = bRows[0];
    if (!booking) {
      throw new AppError(404, "Захиалга олдсонгүй.");
    }
    if (Number(booking.patient_user_id) !== customerUserId) {
      throw new AppError(403, "Энэ захиалгын төлбөрийг төлөх эрхгүй.");
    }
    if (Number(booking.payment_required) !== 1) {
      throw new AppError(400, "Энэ захиалгад төлбөр шаардлагагүй.");
    }
    if (booking.status === "cancelled") {
      throw new AppError(400, "Цуцлагдсан захиалгад төлбөр төлөхгүй.");
    }
    if (booking.payment_status === "paid") {
      await conn.commit();
      return booking;
    }
    const alreadyPaidTx = await walletRepo.findBookingPaymentTx(customerUserId, bid, conn);
    if (alreadyPaidTx) {
      await conn.execute(`UPDATE bookings SET payment_status = 'paid' WHERE id = ? AND payment_status <> 'paid'`, [bid]);
      const [synced] = await conn.execute(`SELECT * FROM bookings WHERE id = ? LIMIT 1`, [bid]);
      await conn.commit();
      return synced[0];
    }
    const total = Number(booking.total_amount);
    if (!(total > 0)) {
      throw new AppError(400, "Төлбөрийн дүн буруу байна.");
    }

    const wallet = await walletRepo.lockWalletForUpdate(conn, customerUserId);
    const bal = Number(wallet.balance);
    if (bal < total) {
      throw new AppError(400, "Дансны үлдэгдэл хүрэлцэхгүй байна.");
    }
    const nextBal = Math.round((bal - total) * 100) / 100;
    await walletRepo.updateWalletBalance(conn, customerUserId, nextBal);
    await walletRepo.insertWalletTransaction(conn, {
      user_id: customerUserId,
      direction: "debit",
      amount: total,
      balance_after: nextBal,
      transaction_type: WALLET_TX_TYPES.BOOKING_PAYMENT,
      reference_type: REFERENCE_TYPES.BOOKING,
      reference_id: bid,
      gateway_ref: `${MOCK_GATEWAYS.WALLET_DEBIT}:${crypto.randomUUID()}`,
      metadata: { booking_id: bid, clinic_id: booking.clinic_id },
    });
    await conn.execute(`UPDATE bookings SET payment_status = 'paid' WHERE id = ?`, [bid]);
    const [out] = await conn.execute(`SELECT * FROM bookings WHERE id = ? LIMIT 1`, [bid]);
    await conn.commit();
    return out[0];
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

/**
 * Төлбөр төлөгдсөн захиалга цуцлагдвал данс руу буцаана. `conn` өгвөл дуудагчийн транзакц дотор ажиллана.
 * @returns {{ refunded: true, amount: number } | null}
 */
async function refundBookingToWalletIfPaid(bookingSnapshot, conn = null) {
  const patientId = Number(bookingSnapshot.patient_user_id);
  const bid = Number(bookingSnapshot.id);
  const amount = Number(bookingSnapshot.total_amount);
  if (bookingSnapshot.payment_status !== "paid" || !(amount > 0)) {
    return null;
  }

  const run = async (c) => {
    const dup = await walletRepo.findBookingRefundTx(patientId, bid, c);
    if (dup) return null;
    const wallet = await walletRepo.lockWalletForUpdate(c, patientId);
    const prev = Number(wallet.balance);
    const next = Math.round((prev + amount) * 100) / 100;
    await walletRepo.updateWalletBalance(c, patientId, next);
    await walletRepo.insertWalletTransaction(c, {
      user_id: patientId,
      direction: "credit",
      amount,
      balance_after: next,
      transaction_type: WALLET_TX_TYPES.BOOKING_REFUND,
      reference_type: REFERENCE_TYPES.BOOKING,
      reference_id: bid,
      gateway_ref: `${MOCK_GATEWAYS.WALLET_REFUND}:${crypto.randomUUID()}`,
      metadata: { booking_id: bid },
    });
    return { refunded: true, amount };
  };

  if (conn) {
    return run(conn);
  }

  const own = await pool.getConnection();
  try {
    await own.beginTransaction();
    const out = await run(own);
    await own.commit();
    return out;
  } catch (e) {
    await own.rollback();
    console.error("[wallet.refundBookingToWalletIfPaid]", e.message || e);
    throw e;
  } finally {
    own.release();
  }
}

async function listMyTransactions(user, listQuery) {
  assertCustomer(user);
  const total = await walletRepo.countWalletTransactions(user.id, {
    transaction_type: listQuery.transaction_type,
  });
  const items = await walletRepo.listWalletTransactions(user.id, {
    transaction_type: listQuery.transaction_type,
    pageSize: listQuery.pageSize,
    offset: listQuery.offset,
  });
  return { items, total };
}

async function addMockPaymentMethod(user, body) {
  assertCustomer(user);
  const code = String(body.provider_code || "most_money").trim().slice(0, 32);
  const label = String(body.label || "Mock арга").trim().slice(0, 191);
  const masked = body.masked_detail != null ? String(body.masked_detail).slice(0, 191) : "****";
  return walletRepo.insertPaymentMethod({
    user_id: user.id,
    provider_code: code,
    label,
    masked_detail: masked,
    is_default: Boolean(body.is_default),
    metadata: { mock: true },
  });
}

async function listMyPaymentMethods(user) {
  assertCustomer(user);
  return walletRepo.listPaymentMethods(user.id);
}

/**
 * QPay-тай төстэй хоёр шаттай жишээ урсгал: эхлээд нэхэмжлэл үүсгэж QR/дата буцаана,
 * дараа нь хэрэглэгч «төлсөн» гэж баталгаажуулахад данс цэнэглэгдэнэ.
 */
function createQpayTopUpInvoice(user, body) {
  assertCustomer(user);
  const amount = toMoney(body.amount);
  if (!amount || amount < 1) {
    throw new AppError(400, "Цэнэглэх дүн 1-ээс их байна.");
  }
  if (amount > 50_000_000) {
    throw new AppError(400, "Нэг удаагийн дүн хэт их байна.");
  }
  const invoiceId = `${MOCK_GATEWAYS.QPAY_INVOICE}:${crypto.randomUUID()}`;
  const ttlMs = 15 * 60 * 1000;
  const expiresAt = Date.now() + ttlMs;
  pendingQpayInvoices.set(invoiceId, { userId: user.id, amount, expiresAt });
  const qrPayload = `QPAY|MONGOL|INV:${invoiceId}|AMT:${amount}|CUR:MNT|MOCK:1`;
  return {
    invoice_id: invoiceId,
    amount_mnt: amount,
    currency: "MNT",
    qr_payload: qrPayload,
    deep_link_mock: `medeasy://pay/qpay?invoice=${encodeURIComponent(invoiceId)}`,
    expires_at: new Date(expiresAt).toISOString(),
    polling_hint_mn: "Жишээ орчин: «Төлбөр төлөгдсөн» товч дарвал баталгаажина.",
  };
}

async function confirmQpayTopUpInvoice(user, body) {
  assertCustomer(user);
  const invoiceId = String(body.invoice_id || "").trim();
  if (!invoiceId) {
    throw new AppError(400, "Нэхэмжлэлийн дугаар оруулна уу.");
  }
  const pending = pendingQpayInvoices.get(invoiceId);
  if (!pending) {
    throw new AppError(404, "Нэхэмжлэл олдсонгүй эсвэл аль хэдийн ашиглагдсан, хугацаа дууссан байна.");
  }
  if (pending.userId !== user.id) {
    throw new AppError(403, "Энэ нэхэмжлэл таны бүртгэлд харьяалагдахгүй байна.");
  }
  if (Date.now() > pending.expiresAt) {
    pendingQpayInvoices.delete(invoiceId);
    throw new AppError(400, "QPay нэхэмжлэлийн хугацаа дууссан. Шинээр үүсгэнэ үү.");
  }
  pendingQpayInvoices.delete(invoiceId);
  return topUpWallet(user, {
    amount: pending.amount,
    mock_gateway: "qpay",
    note: `QPay mock ${invoiceId}`,
  });
}

module.exports = {
  getWalletBalance,
  topUpWallet,
  payBookingFromWallet,
  refundBookingToWalletIfPaid,
  listMyTransactions,
  addMockPaymentMethod,
  listMyPaymentMethods,
  createQpayTopUpInvoice,
  confirmQpayTopUpInvoice,
};
