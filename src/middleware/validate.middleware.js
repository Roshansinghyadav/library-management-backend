const { validationResult } = require('express-validator');

/**
 * Runs after express-validator rules.
 * Returns 422 with all validation errors if any found.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: 'Validation failed',
      details: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

module.exports = { validate };
