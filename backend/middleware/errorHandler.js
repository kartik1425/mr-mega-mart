const env = require('../config/env')
const { logger, metrics } = require('../services/logger')

/**
 * Centralized Security Error Handling Middleware with Structured Observability
 */
const errorHandler = (err, req, res, next) => {
  metrics.increment('totalErrors')

  const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode)
  const code = err.code || 'INTERNAL_SERVER_ERROR'
  const message = err.message || 'An internal server error occurred.'

  // Structured Error Logging (omits credentials/secrets)
  logger.error({
    event: 'http_error',
    requestId: req.id,
    method: req.method,
    route: req.baseUrl + (req.route ? req.route.path : req.path),
    statusCode,
    code,
    errorType: err.name || 'Error',
    errorMessage: message,
    stack: env.NODE_ENV !== 'production' ? err.stack : undefined,
  }, `HTTP ${statusCode} Error: ${message}`)

  const response = {
    success: false,
    message,
    code,
  }

  // Include stack trace in JSON output ONLY in non-production environments
  if (env.NODE_ENV !== 'production' && err.stack) {
    response.stack = err.stack
  }

  res.status(statusCode).json(response)
}

module.exports = errorHandler
