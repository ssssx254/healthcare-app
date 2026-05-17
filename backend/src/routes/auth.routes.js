const express = require("express");
const authController = require("../controllers/auth.controller");
const { validateBody } = require("../middleware/validate");
const {
  validateRegisterBody,
  validateLoginBody,
  validateForgotPasswordBody,
  validateResetPasswordBody,
} = require("../validators/auth.validators");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/register", validateBody(validateRegisterBody), authController.register);
router.post("/login", validateBody(validateLoginBody), authController.login);
router.post("/forgot-password", validateBody(validateForgotPasswordBody), authController.forgotPassword);
router.post("/reset-password", validateBody(validateResetPasswordBody), authController.resetPassword);
router.get("/me", requireAuth, authController.me);

module.exports = router;
