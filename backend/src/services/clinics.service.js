const { AppError } = require("../utils/appError");
const { assertEmail, optionalTrimmedString } = require("../utils/validation");
const clinicsRepo = require("../repositories/clinics.repository");
const authRepo = require("../repositories/auth.repository");

async function assertClinicOwner(clinicId, userId) {
  const row = await clinicsRepo.findClinicOwnedByUser(clinicId, userId);
  if (!row) {
    throw new AppError(403, "Энэ эмнэлгийг засах эрхгүй.");
  }
}

function assertClinicPhone(phone) {
  if (typeof phone !== "string" || phone.trim().length === 0) {
    throw new AppError(400, "Утасны дугаар заавал.");
  }
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) {
    throw new AppError(400, "Утасны дугаар 8–15 оронтой байна.");
  }
  return phone.trim().slice(0, 32);
}

function assertClinicAddress(address) {
  if (typeof address !== "string" || address.trim().length < 5) {
    throw new AppError(400, "Хаяг хамгийн багадаа 5 тэмдэгт байна.");
  }
  const t = address.trim();
  if (t.length > 500) {
    throw new AppError(400, "Хаяг хэт урт байна.");
  }
  return t;
}

function assertClinicName(name) {
  if (typeof name !== "string" || name.trim().length < 2) {
    throw new AppError(400, "Эмнэлгийн нэр хамгийн багадаа 2 тэмдэгт байна.");
  }
  const t = name.trim();
  if (t.length > 191) {
    throw new AppError(400, "Эмнэлгийн нэр хэт урт байна.");
  }
  return t;
}

async function createClinic(ownerUserId, body) {
  const { clinic_name, description, address, phone, email, city, clinic_type } = body;
  const name = assertClinicName(clinic_name);
  const addr = assertClinicAddress(address);
  const ph = assertClinicPhone(phone);
  const desc = optionalTrimmedString(description, 2000);
  const cityVal = optionalTrimmedString(city, 128);
  const typeVal = optionalTrimmedString(clinic_type, 128);
  let emailNorm = null;
  if (email !== undefined && email !== null && String(email).trim() !== "") {
    emailNorm = assertEmail(email, "Эмнэлгийн имэйл");
  }
  const clinicId = await clinicsRepo.createClinic({
    owner_user_id: ownerUserId,
    clinic_name: name,
    description: desc,
    address: addr,
    city: cityVal,
    clinic_type: typeVal,
    phone: ph,
    email: emailNorm,
    approval_status: "approved",
  });
  return getClinicById(clinicId);
}

async function listPublicClinics(validatedQuery) {
  const total = await clinicsRepo.countClinicsPublic(validatedQuery);
  const items = await clinicsRepo.listClinicsPublicPaged(validatedQuery);
  return { items, total };
}

async function getClinicById(id, { restrictToApproved = false } = {}) {
  const row = await clinicsRepo.findClinicById(id);
  if (!row) {
    throw new AppError(404, "Эмнэлэг олдсонгүй.");
  }
  if (restrictToApproved && row.approval_status !== "approved") {
    throw new AppError(404, "Эмнэлэг олдсонгүй.");
  }
  return row;
}

const LOGO_URL_MAX_LENGTH = 5_000_000;

function normalizeLogoUrl(value) {
  if (value === undefined) return undefined;
  if (value === null || String(value).trim() === "") return null;
  const logo_url = String(value).trim();
  if (logo_url.length > LOGO_URL_MAX_LENGTH) {
    throw new AppError(400, "Лого хэт том байна. Жижиг зураг сонгоно уу.");
  }
  return logo_url;
}

async function updateClinic(clinicId, ownerUserId, body) {
  await assertClinicOwner(clinicId, ownerUserId);
  const patch = {};
  const allowed = ["clinic_name", "description", "address", "phone", "email"];
  for (const key of allowed) {
    if (body[key] !== undefined) {
      patch[key] = body[key];
    }
  }
  if (body.logo_url !== undefined) {
    patch.logo_url = normalizeLogoUrl(body.logo_url);
  }
  if (Object.keys(patch).length === 0) {
    throw new AppError(400, "Шинэчлэх талбар байхгүй байна.");
  }
  await clinicsRepo.updateClinicById(clinicId, patch);
  return getClinicById(clinicId);
}

async function getClinicByProvider(providerUserId) {
  const providerId = Number(providerUserId);
  if (!Number.isInteger(providerId) || providerId <= 0) {
    throw new AppError(400, "provider_user_id буруу байна.");
  }
  const provider = await authRepo.findUserById(providerId);
  if (!provider || provider.role !== "provider") {
    throw new AppError(404, "Үйлчилгээ үзүүлэгч олдсонгүй.");
  }
  const clinic = await clinicsRepo.findClinicByOwnerUserId(providerId);
  return {
    provider_user_id: providerId,
    onboarding_status: provider.onboarding_status,
    clinic: clinic || null,
  };
}

module.exports = {
  createClinic,
  listPublicClinics,
  getClinicById,
  updateClinic,
  getClinicByProvider,
  assertClinicOwner,
};
