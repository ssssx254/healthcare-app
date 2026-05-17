const express = require("express");
const questionnairesController = require("../controllers/questionnaires.controller");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.post("/", requireAuth, requireRole("customer"), questionnairesController.create);
router.get("/:id", requireAuth, questionnairesController.getOne);

module.exports = router;
