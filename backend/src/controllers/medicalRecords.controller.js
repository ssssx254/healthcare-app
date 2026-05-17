const medicalRecordsService = require("../services/medicalRecords.service");
const { ok, created } = require("../utils/apiResponse");
const { asyncHandler } = require("../utils/asyncHandler");

const createNote = asyncHandler(async (req, res) => {
  const row = await medicalRecordsService.createMedicalNote(req.user.id, req.body);
  return created(res, row, "Эмчийн тэмдэглэл хадгалагдлаа");
});

const listNotesForPatient = asyncHandler(async (req, res) => {
  const rows = await medicalRecordsService.listMedicalNotesForPatientQuery(req.user.id, req.query);
  return ok(res, rows);
});

const listMyNotes = asyncHandler(async (req, res) => {
  const rows = await medicalRecordsService.listMyMedicalNotes(req.user.id);
  return ok(res, rows);
});

const createPrescription = asyncHandler(async (req, res) => {
  const row = await medicalRecordsService.createPrescription(req.user.id, req.body);
  return created(res, row, "Жор бүртгэгдлээ");
});

const listPrescriptionsForPatient = asyncHandler(async (req, res) => {
  const rows = await medicalRecordsService.listPrescriptionsForPatientQuery(req.user.id, req.query);
  return ok(res, rows);
});

const listMyPrescriptions = asyncHandler(async (req, res) => {
  const rows = await medicalRecordsService.listMyPrescriptions(req.user.id);
  return ok(res, rows);
});

const createLabResult = asyncHandler(async (req, res) => {
  const row = await medicalRecordsService.createLabTestResult(req.user, req.body);
  return created(res, row, "Шинжилгээний мэдээлэл хадгалагдлаа");
});

const listLabResultsForPatient = asyncHandler(async (req, res) => {
  const rows = await medicalRecordsService.listLabResultsForPatientQuery(req.user.id, req.query);
  return ok(res, rows);
});

const listMyLabResults = asyncHandler(async (req, res) => {
  const rows = await medicalRecordsService.listMyLabResults(req.user.id);
  return ok(res, rows);
});

module.exports = {
  createNote,
  listNotesForPatient,
  listMyNotes,
  createPrescription,
  listPrescriptionsForPatient,
  listMyPrescriptions,
  createLabResult,
  listLabResultsForPatient,
  listMyLabResults,
};
