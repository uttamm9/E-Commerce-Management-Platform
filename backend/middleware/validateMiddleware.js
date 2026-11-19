const { validationResult } = require('express-validator');

/**
 * Middleware to check for validation errors from express-validator.
 * Returns HTTP 400 with a structured error response if validation fails.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorList = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
    }));

    return res.status(400).json({
      success: false,
      message: errorList[0].message,
      errors: errorList,
    });
  }
  next();
};

module.exports = validate;
