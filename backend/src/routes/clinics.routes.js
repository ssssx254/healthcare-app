const express = require("express");
const clinicsController = require("../controllers/clinics.controller");
const { requireAuth, requireApprovedProvider } = require("../middleware/auth");
const { validateQuery, validateParams } = require("../middleware/validate");
const { validatePublicClinicsListQuery } = require("../validators/listQuery.validators");
const { validateIdParam, validatePositiveIntParam } = require("../validators/params.validators");

const router = express.Router();

const idParam = validateParams(validateIdParam("id"));

router.get("/", validateQuery(validatePublicClinicsListQuery), clinicsController.list);
router.get(
  "/provider/:providerUserId",
  validateParams(validatePositiveIntParam("providerUserId", "provider_user_id")),
  clinicsController.getByProvider,
);
router.get("/:id", idParam, clinicsController.getOne);
router.post("/", requireAuth, requireApprovedProvider, clinicsController.create);
router.put("/:id", requireAuth, requireApprovedProvider, idParam, clinicsController.update);

module.exports = router;
