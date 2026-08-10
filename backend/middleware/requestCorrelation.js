const crypto = require('crypto')

/**
 * Request Correlation ID Middleware
 * Validates or generates a unique X-Request-ID for tracing requests across logs.
 */
const requestCorrelation = (req, res, next) => {
  let requestId = req.headers['x-request-id'] || req.headers['x-correlation-id']

  // Validate format and length to prevent log injection
  if (!requestId || typeof requestId !== 'string' || requestId.length > 64 || !/^[a-zA-Z0-9_-]+$/.test(requestId)) {
    requestId = crypto.randomUUID()
  }

  req.id = requestId
  res.setHeader('X-Request-ID', requestId)
  next()
}

module.exports = requestCorrelation
