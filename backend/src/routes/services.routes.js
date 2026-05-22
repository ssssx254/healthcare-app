const express = require("express");
const servicesController = require("../controllers/services.controller");
const { requireAuth, requireApprovedProvider } = require("../middleware/auth");
const { validateQuery, validateParams } = require("../middleware/validate");
const { validateServicesListQuery } = require("../validators/listQuery.validators");
const { validateIdParam } = require("../validators/params.validators");

const router = express.Router();
const clinicCategoriesController = require("../controllers/clinicCategories.controller");

const idParam = validateParams(validateIdParam("id"));

router.get("/", validateQuery(validateServicesListQuery), servicesController.list);
router.get("/categories/public", clinicCategoriesController.listPublic);
router.get("/:id", idParam, servicesController.getOne);
router.post("/", requireAuth, requireApprovedProvider, servicesController.create);
router.put("/:id", requireAuth, requireApprovedProvider, idParam, servicesController.update);
router.delete("/:id", requireAuth, requireApprovedProvider, idParam, servicesController.remove);

module.exports = router;
