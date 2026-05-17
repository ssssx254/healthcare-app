const { AppError } = require("../utils/appError");
const { assertEmail, assertPasswordForRegister } = require("../utils/validation");

/** Data URL эсвэл HTTPS — JSON body + DB хязгаарт багтах */
const LOGO_URL_MAX_LENGTH = 5_000_000;

function trimmed(value) {
  return typeof value === "string" ? value.trim() : "";
}

function toBool(value) {
  if (value === true || value === 1 || value === "1" || value === "true") return true;
  if (value === false || value === 0 || value === "0" || value === "false") return false;
  return null;
}

function validateProviderOnboardingBody(body) {
  const manager_name = trimmed(body.manager_name);
  const account_email = assertEmail(body.account_email, "Аккаунтын имэйл");
  const account_phone = trimmed(body.account_phone);
  const clinic_name = trimmed(body.clinic_name);
  const clinic_type = trimmed(body.clinic_type);
  const introduction = trimmed(body.introduction);
  const logo_url = trimmed(body.logo_url) || null;
  if (logo_url && logo_url.length > LOGO_URL_MAX_LENGTH) {
    throw new AppError(400, "Лого хэт том байна. Жижиг зураг сонгоно уу.");
  }
  const address = trimmed(body.address);
  const city = trimmed(body.city);
  const district = trimmed(body.district);
  const contact_phone = trimmed(body.contact_phone);
  const contact_email = assertEmail(body.contact_email, "Холбоо барих имэйл");
  const working_hours = trimmed(body.working_hours);
  const online_enabled = toBool(body.online_enabled);
  const ambulatory_enabled = toBool(body.ambulatory_enabled);
  const supported_specialties = trimmed(body.supported_specialties);

  if (!manager_name) throw new AppError(400, "Хариуцсан хүний нэр оруулна уу.");
  if (!account_phone) throw new AppError(400, "Аккаунтын утас оруулна уу.");
  if (!clinic_name) throw new AppError(400, "Эмнэлгийн нэр оруулна уу.");
  if (!clinic_type) throw new AppError(400, "Эмнэлгийн төрөл оруулна уу.");
  if (!introduction) throw new AppError(400, "Танилцуулга оруулна уу.");
  if (!address) throw new AppError(400, "Хаяг оруулна уу.");
  if (!city) throw new AppError(400, "Хот оруулна уу.");
  if (!district) throw new AppError(400, "Дүүрэг оруулна уу.");
  if (!contact_phone) throw new AppError(400, "Холбоо барих утас оруулна уу.");
  if (!working_hours) throw new AppError(400, "Ажиллах цаг оруулна уу.");
  if (online_enabled == null) throw new AppError(400, "Онлайн зөвлөгөөний төлөв буруу байна.");
  if (ambulatory_enabled == null) throw new AppError(400, "Амбулаторийн төлөв буруу байна.");
  if (!supported_specialties) throw new AppError(400, "Дэмжих мэргэжлийн чиглэлүүд оруулна уу.");

  return {
    manager_name,
    account_email,
    account_phone,
    clinic_name,
    clinic_type,
    introduction,
    logo_url,
    address,
    city,
    district,
    contact_phone,
    contact_email,
    working_hours,
    online_enabled,
    ambulatory_enabled,
    supported_specialties,
  };
}

function validateProviderOnboardingRegisterBody(body) {
  const password = assertPasswordForRegister(body.password);
  const onboarding = validateProviderOnboardingBody(body);
  return {
    ...onboarding,
    password,
  };
}

function validateProviderReviewBody(body) {
  const decision = trimmed(body.decision).toLowerCase();
  const feedback = trimmed(body.feedback) || null;
  if (!["approved", "rejected"].includes(decision)) {
    throw new AppError(400, "Шийдвэр зөвхөн approved эсвэл rejected байна.");
  }
  if (decision === "rejected" && !feedback) {
    throw new AppError(400, "Татгалзсан үед тайлбар (feedback) заавал байна.");
  }
  return { decision, feedback };
}

module.exports = {
  validateProviderOnboardingRegisterBody,
  validateProviderOnboardingBody,
  validateProviderReviewBody,
};

