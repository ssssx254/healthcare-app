const express = require("express");
const adminController = require("../controllers/admin.controller");
const { requireAuth, requireRole } = require("../middleware/auth");
const { validateBody, validateQuery, validateParams } = require("../middleware/validate");
const { validateProviderReviewBody } = require("../validators/providerOnboarding.validators");
const {
  validateClinicApprovalBody,
  validateContentReportReviewBody,
  validateFeaturedCreateBody,
  validateFeaturedUpdateBody,
  validateNotificationBroadcastBody,
} = require("../validators/admin.validators");
const {
  validateAdminClinicsListQuery,
  validateAdminDoctorsListQuery,
  validateAdminUsersListQuery,
  validateAdminContentReportsListQuery,
} = require("../validators/listQuery.validators");
const { validateIdParam, validatePositiveIntParam } = require("../validators/params.validators");
const { ROLES } = require("../constants/roles");

const router = express.Router();

router.use(requireAuth, requireRole(ROLES.SYSTEM_ADMIN));

const idParam = validateParams(validateIdParam("id"));

router.get("/dashboard", adminController.dashboard);
router.get("/payments/overview", adminController.paymentsOverview);

router.get("/providers/registrations/pending", adminController.listPendingProviders);
router.patch(
  "/providers/registrations/:providerUserId/review",
  validateParams(validatePositiveIntParam("providerUserId", "provider_user_id")),
  validateBody(validateProviderReviewBody),
  adminController.reviewProvider,
);

router.get("/clinics", validateQuery(validateAdminClinicsListQuery), adminController.listClinics);
router.patch(
  "/clinics/:id/approval",
  idParam,
  validateBody(validateClinicApprovalBody),
  adminController.patchClinicApproval,
);

router.get("/doctors", validateQuery(validateAdminDoctorsListQuery), adminController.listDoctors);
router.get("/users", validateQuery(validateAdminUsersListQuery), adminController.listUsers);
router.patch(
  "/providers/:providerUserId/suspension",
  validateParams(validatePositiveIntParam("providerUserId", "provider_user_id")),
  adminController.patchProviderSuspension,
);

router.get(
  "/content-reports",
  validateQuery(validateAdminContentReportsListQuery),
  adminController.listContentReports,
);
router.patch(
  "/content-reports/:id",
  idParam,
  validateBody(validateContentReportReviewBody),
  adminController.patchContentReport,
);

router.get("/featured/items", adminController.listFeatured);
router.post("/featured/items", validateBody(validateFeaturedCreateBody), adminController.createFeatured);
router.patch(
  "/featured/items/:id",
  idParam,
  validateBody(validateFeaturedUpdateBody),
  adminController.patchFeatured,
);
router.delete("/featured/items/:id", idParam, adminController.deleteFeatured);
router.post("/notifications/broadcast", validateBody(validateNotificationBroadcastBody), adminController.broadcastNotification);

module.exports = router;
