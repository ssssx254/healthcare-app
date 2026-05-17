const { AppError } = require("../utils/appError");
const { assertPositiveIntId, optionalTrimmedString } = require("../utils/validation");

function validateClinicApprovalBody(body) {
  const status = String(body.approval_status || "").trim().toLowerCase();
  if (!["approved", "rejected", "pending"].includes(status)) {
    throw new AppError(400, "approval_status нь pending, approved эсвэл rejected байна.");
  }
  return { approval_status: status };
}

const REPORT_STATUSES = new Set(["open", "reviewing", "resolved", "dismissed"]);

function validateContentReportReviewBody(body) {
  const status = String(body.status || "").trim().toLowerCase();
  if (!REPORT_STATUSES.has(status)) {
    throw new AppError(400, "Төлөв буруу байна.");
  }
  const admin_notes = optionalTrimmedString(body.admin_notes, 4000);
  return { status, admin_notes };
}

const FEATURE_TYPES = new Set(["clinic", "article"]);
const BROADCAST_AUDIENCE = new Set(["all", "customer", "provider", "system_admin"]);

function validateFeaturedCreateBody(body) {
  const item_type = String(body.item_type || "").trim().toLowerCase();
  if (!FEATURE_TYPES.has(item_type)) {
    throw new AppError(400, "item_type нь clinic эсвэл article байна.");
  }
  const sort_order = Number(body.sort_order);
  const is_active = body.is_active === undefined ? true : Boolean(body.is_active);
  if (item_type === "clinic") {
    const clinic_id = assertPositiveIntId(body.clinic_id, "clinic_id");
    return {
      item_type,
      clinic_id,
      article_title: null,
      article_excerpt: null,
      article_url: null,
      sort_order: Number.isInteger(sort_order) ? sort_order : 0,
      is_active,
    };
  }
  const article_title = optionalTrimmedString(body.article_title, 191);
  if (!article_title) {
    throw new AppError(400, "article_title заавал байна.");
  }
  return {
    item_type,
    clinic_id: null,
    article_title,
    article_excerpt: optionalTrimmedString(body.article_excerpt, 2000),
    article_url: optionalTrimmedString(body.article_url, 512),
    sort_order: Number.isInteger(sort_order) ? sort_order : 0,
    is_active,
  };
}

function validateFeaturedUpdateBody(body) {
  const patch = {};
  if (body.sort_order !== undefined) {
    const n = Number(body.sort_order);
    if (!Number.isInteger(n)) throw new AppError(400, "sort_order бүхэл тоо байна.");
    patch.sort_order = n;
  }
  if (body.is_active !== undefined) patch.is_active = Boolean(body.is_active);
  if (body.article_title !== undefined) patch.article_title = optionalTrimmedString(body.article_title, 191);
  if (body.article_excerpt !== undefined) patch.article_excerpt = optionalTrimmedString(body.article_excerpt, 2000);
  if (body.article_url !== undefined) patch.article_url = optionalTrimmedString(body.article_url, 512);
  if (body.clinic_id !== undefined) {
    if (body.clinic_id === null) patch.clinic_id = null;
    else patch.clinic_id = assertPositiveIntId(body.clinic_id, "clinic_id");
  }
  if (Object.keys(patch).length === 0) {
    throw new AppError(400, "Шинэчлэх талбар байхгүй байна.");
  }
  return patch;
}

function validateNotificationBroadcastBody(body) {
  const audience = String(body.audience || "").trim().toLowerCase();
  if (!BROADCAST_AUDIENCE.has(audience)) {
    throw new AppError(400, "audience нь all, customer, provider, system_admin байна.");
  }
  const title = optionalTrimmedString(body.title, 255);
  if (!title) {
    throw new AppError(400, "title оруулна уу.");
  }
  const message = optionalTrimmedString(body.message, 4000);
  if (!message) {
    throw new AppError(400, "message оруулна уу.");
  }
  const type = optionalTrimmedString(body.type, 64) || "admin_broadcast";
  return { audience, title, message, type };
}

module.exports = {
  validateClinicApprovalBody,
  validateContentReportReviewBody,
  validateFeaturedCreateBody,
  validateFeaturedUpdateBody,
  validateNotificationBroadcastBody,
};
