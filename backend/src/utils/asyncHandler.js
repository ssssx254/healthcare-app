/**
 * Async route handler wrapper — алдааг `next(err)` руу дамжуулна.
 */
function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { asyncHandler };
