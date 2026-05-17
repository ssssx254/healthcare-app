const { AppError } = require("../utils/appError");

/**
 * validateBody((body) => sanitizedBody)
 * - validator нь алдаа шидвэл errorHandler руу дамжина
 * - амжилттай бол req.body-ийг цэвэрлэсэн утгаар солино
 */
function validateBody(validator) {
  return (req, res, next) => {
    try {
      req.body = validator(req.body || {});
      return next();
    } catch (e) {
      if (e instanceof AppError) return next(e);
      return next(new AppError(400, "Илгээсэн мэдээлэл буруу байна."));
    }
  };
}

/**
 * validateQuery((query) => normalized)
 * - GET query-г шалгаж `req.validatedQuery` дээр хадгална
 */
function validateQuery(validator) {
  return (req, res, next) => {
    try {
      req.validatedQuery = validator(req.query || {});
      return next();
    } catch (e) {
      if (e instanceof AppError) return next(e);
      return next(new AppError(400, "Query параметр буруу байна."));
    }
  };
}

/**
 * validateParams((params) => normalized)
 * - `req.validatedParams` (жишээ нь `{ id }`)
 */
function validateParams(validator) {
  return (req, res, next) => {
    try {
      req.validatedParams = validator(req.params || {});
      return next();
    } catch (e) {
      if (e instanceof AppError) return next(e);
      return next(new AppError(400, "URL параметр буруу байна."));
    }
  };
}

module.exports = { validateBody, validateQuery, validateParams };

