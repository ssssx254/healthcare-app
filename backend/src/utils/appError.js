class AppError extends Error {
  /**
   * @param {number} statusCode HTTP status
   * @param {string} message Mongolian or English message for client
   * @param {object} [extra] optional { code, details }
   */
  constructor(statusCode, message, extra = {}) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = extra.code;
    this.details = extra.details;
  }
}

module.exports = { AppError };
