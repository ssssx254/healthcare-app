const { fail } = require("../utils/apiResponse");

function notFound(req, res) {
  return fail(res, 404, "Зам олдсонгүй");
}

module.exports = { notFound };
