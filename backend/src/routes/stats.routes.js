const express = require("express");
const statsController = require("../controllers/stats.controller");
const { requireAuth, requireRole } = require("../middleware/auth");
const { ROLES } = require("../constants/roles");

const router = express.Router();

router.get("/customer", requireAuth, requireRole(ROLES.CUSTOMER), statsController.customerStats);
router.get("/provider", requireAuth, requireRole(ROLES.PROVIDER), statsController.providerStats);
router.get("/admin", requireAuth, requireRole(ROLES.SYSTEM_ADMIN), statsController.adminStats);

module.exports = router;

