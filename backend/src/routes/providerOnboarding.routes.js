const express = require("express");
const { registerWithOnboarding, submit, getMyStatus } = require("../controllers/providerOnboarding.controller");
const { requireAuth, requireRole } = require("../middleware/auth");
const { validateBody } = require("../middleware/validate");
const {
  validateProviderOnboardingRegisterBody,
  validateProviderOnboardingBody,
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

module.exports = router;

