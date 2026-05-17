const express = require("express");
const doctorsController = require("../controllers/doctors.controller");
const { requireAuth, requireApprovedProvider } = require("../middleware/auth");
const { validateQuery, validateParams } = require("../middleware/validate");
const { validateDoctorsListQuery } = require("../validators/listQuery.validators");
const { validateIdParam } = require("../validators/params.validators");

const router = express.Router();

const idParam = validateParams(validateIdParam("id"));

router.get("/", validateQuery(validateDoctorsListQuery), doctorsController.list);
router.get("/:id", idParam, doctorsController.getOne);
router.post("/", requireAuth, requireApprovedProvider, doctorsController.create);
router.put("/:id", requireAuth, requireApprovedProvider, idParam, doctorsController.update);

module.exports = router;
