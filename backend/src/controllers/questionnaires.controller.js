const questionnairesService = require("../services/questionnaires.service");
const { ok, created } = require("../utils/apiResponse");
const { asyncHandler } = require("../utils/asyncHandler");

const create = asyncHandler(async (req, res) => {
  const row = await questionnairesService.createQuestionnaire(req.user.id, req.body);
  return created(res, row, "Анкет хадгалагдлаа");
});

const getOne = asyncHandler(async (req, res) => {
  const row = await questionnairesService.getQuestionnaireById(req.params.id, req.user);
  return ok(res, row);
});

module.exports = { create, getOne };
