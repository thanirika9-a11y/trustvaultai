const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      code: 'VALIDATION_ERROR',
      details: errors.array()
    });
  }
  next();
};

module.exports = validate;
