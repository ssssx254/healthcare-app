const express = require("express");
const doctorsController = require("../controllers/doctors.controller");
const { requireAuth, attachUserIfAuthenticated, requireRole, requireApprovedProvider } = require("../middleware/auth");
const { ROLES } = require("../constants/roles");
const { validateQuery, validateParams, validateBody } = require("../middleware/validate");
const { validateDoctorsListQuery } = require("../validators/listQuery.validators");
const {
  validateDoctorReviewsListQuery,
  validateFeaturedDoctorsQuery,
  validateCreateDoctorReviewBody,
} = require("../validators/doctorReviews.validators");
const { validateIdParam } = require("../validators/params.validators");

const router = express.Router();

const idParam = validateParams(validateIdParam("id"));

router.get("/featured", validateQuery(validateFeaturedDoctorsQuery), doctorsController.listFeatured);
router.get("/", validateQuery(validateDoctorsListQuery), doctorsController.list);
router.get("/:id/reviews", idParam, validateQuery(validateDoctorReviewsListQuery), attachUserIfAuthenticated, doctorsController.listReviews);
router.post(
  "/:id/reviews",
  requireAuth,
  requireRole(ROLES.CUSTOMER),
  idParam,
  validateBody(validateCreateDoctorReviewBody),
  doctorsController.createReview,
);
router.get("/:id", idParam, doctorsController.getOne);
router.post("/", requireAuth, requireApprovedProvider, doctorsController.create);
router.put("/:id", requireAuth, requireApprovedProvider, idParam, doctorsController.update);

module.exports = router;
