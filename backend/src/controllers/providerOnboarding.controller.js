const {
  registerProviderWithOnboarding,
  submitProviderOnboarding,
  getProviderOnboardingStatus,
  updateProviderLogo,
} = require("../services/providerOnboarding.service");
const { ok, created } = require("../utils/apiResponse");

async function registerWithOnboarding(req, res, next) {
  try {
    const result = await registerProviderWithOnboarding(req.body);
    return created(res, result, "Provider onboarding бүртгэл амжилттай.");
  } catch (err) {
    return next(err);
  }
}

async function submit(req, res, next) {
  try {
    const result = await submitProviderOnboarding(req.user, req.body);
    return ok(res, result, "Provider onboarding мэдээлэл хадгалагдлаа.");
  } catch (err) {
    return next(err);
  }
}

async function getMyStatus(req, res, next) {
  try {
    const result = await getProviderOnboardingStatus(req.user);
    return ok(res, result, "Provider onboarding төлөв.");
  } catch (err) {
    return next(err);
  }
}

async function patchLogo(req, res, next) {
  try {
    const result = await updateProviderLogo(req.user, req.body);
    return ok(res, result, "Лого шинэчлэгдлээ.");
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  registerWithOnboarding,
  submit,
  getMyStatus,
  patchLogo,
};

