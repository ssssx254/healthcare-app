const express = require("express");
const { registerWithOnboarding, submit, getMyStatus, patchLogo } = require("../controllers/providerOnboarding.controller");
const { requireAuth, requireRole } = require("../middleware/auth");
const { validateBody } = require("../middleware/validate");
const {
  validateProviderOnboardingRegisterBody,
  validateProviderOnboardingBody,
  validateProviderLogoPatchBody,
} = require("../validators/providerOnboarding.validators");
const { ROLES } = require("../constants/roles");

const router = express.Router();

router.post("/register", validateBody(validateProviderOnboardingRegisterBody), registerWithOnboarding);

router.post(
  "/submit",
  requireAuth,
  requireRole(ROLES.PROVIDER),
  validateBody(validateProviderOnboardingBody),
  submit,
);

router.get("/status", requireAuth, requireRole(ROLES.PROVIDER), getMyStatus);

router.patch(
  "/logo",
  requireAuth,
  requireRole(ROLES.PROVIDER),
  validateBody(validateProviderLogoPatchBody),
  patchLogo,
);

module.exports = router;

