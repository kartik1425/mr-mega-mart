const { logger, metrics } = require('../services/logger')
const env = require('../config/env')

/**
 * HTTP Request/Response Observability Middleware
 */
const requestLogger = (req, res, next) => {
  const startTime = performance.now()
  metrics.increment('totalRequests')

  res.on('finish', () => {
    const durationMs = Math.round(performance.now() - startTime)
    const logData = {
      event: 'http_request',
      requestId: req.id,
      method: req.method,
      route: req.baseUrl + (req.route ? req.route.path : req.path),
      statusCode: res.statusCode,
      durationMs,
      userAgent: req.headers['user-agent'] || 'unknown',
    }

    if (req.user && req.user.id) {
      logData.userId = req.user.id
    }

    // Check for slow request threshold
    if (durationMs >= env.SLOW_REQUEST_THRESHOLD_MS) {
      logger.warn({
        ...logData,
        event: 'slow_request',
        thresholdMs: env.SLOW_REQUEST_THRESHOLD_MS,
      }, `Slow request detected: ${req.method} ${logData.route} took ${durationMs}ms`)
    } else {
      logger.info(logData, `${req.method} ${logData.route} ${res.statusCode} - ${durationMs}ms`)
    }
  })

  next()
}

module.exports = requestLogger
