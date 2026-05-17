const express = require("express");
const paymentsController = require("../controllers/payments.controller");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/provider/revenue-summary", requireAuth, requireRole("provider"), paymentsController.providerRevenue);

module.exports = router;
