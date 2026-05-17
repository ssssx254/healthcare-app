const express = require("express");
const contentReportsController = require("../controllers/contentReports.controller");
const { requireAuth } = require("../middleware/auth");
const { validateBody } = require("../middleware/validate");
const { validateContentReportCreateBody } = require("../validators/contentReports.validators");

const router = express.Router();

router.post("/content", requireAuth, validateBody(validateContentReportCreateBody), contentReportsController.create);

module.exports = router;
