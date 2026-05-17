const { assertPositiveIntId } = require("../utils/validation");

/** Express route params — зөвхөн эерэг бүхэл ID (`id` талбар) */
function validateIdParam(paramName = "id") {
  return (params) => ({
    id: assertPositiveIntId(params[paramName] ?? params.id, paramName),
  });
}

/** `{ [paramName]: number }` — жишээ нь `providerUserId` */
function validatePositiveIntParam(paramName, errorLabel = paramName) {
  return (params) => ({
    [paramName]: assertPositiveIntId(params[paramName], errorLabel),
  });
}

module.exports = { validateIdParam, validatePositiveIntParam };
