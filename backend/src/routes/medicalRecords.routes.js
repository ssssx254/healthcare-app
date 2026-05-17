const express = require("express");
const medicalRecordsController = require("../controllers/medicalRecords.controller");
const { requireAuth, requireRole, requireApprovedProvider } = require("../middleware/auth");

const router = express.Router();

/** Өвчтөний өөрийн уншлага */
router.get("/my/notes", requireAuth, requireRole("customer"), medicalRecordsController.listMyNotes);
router.get("/my/prescriptions", requireAuth, requireRole("customer"), medicalRecordsController.listMyPrescriptions);
router.get("/my/lab-results", requireAuth, requireRole("customer"), medicalRecordsController.listMyLabResults);

/** Эмнэлэг: өвчтөний түүх (захиалгатай холбоотой шүүлттэй) */
router.post("/notes", requireAuth, requireApprovedProvider, medicalRecordsController.createNote);
router.get("/notes", requireAuth, requireApprovedProvider, medicalRecordsController.listNotesForPatient);

router.post("/prescriptions", requireAuth, requireApprovedProvider, medicalRecordsController.createPrescription);
router.get(
  "/prescriptions",
  requireAuth,
  requireApprovedProvider,
  medicalRecordsController.listPrescriptionsForPatient,
);

router.post("/lab-results", requireAuth, medicalRecordsController.createLabResult);
router.get(
  "/lab-results",
  requireAuth,
  requireApprovedProvider,
  medicalRecordsController.listLabResultsForPatient,
);

module.exports = router;
