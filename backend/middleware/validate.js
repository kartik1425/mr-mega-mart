const { validationResult } = require('express-validator')

/**
 * Enterprise Validation Result Formatter Middleware
 * Intercepts express-validator errors and returns consistent 400 Bad Request
 */
const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (errors.isEmpty()) {
    return next()
  }

  const formattedErrors = errors.array().map((err) => ({
    field: err.path || err.param,
    message: err.msg,
  }))

  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: formattedErrors,
  })
}

module.exports = validate
