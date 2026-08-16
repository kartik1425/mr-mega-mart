const env = require('../../config/env')

const redactPaths = [
  'password',
  'passwordHash',
  'user.password',
  'token',
  'accessToken',
  'refreshToken',
  'authorization',
  'headers.authorization',
  'req.headers.authorization',
  'cookie',
  'headers.cookie',
  'req.headers.cookie',
  'secret',
  'apiKey',
  'stripeSecretKey',
  'webhookSecret',
  'redisPassword',
  'mongodbUri',
]

let logger
try {
  const pino = require('pino')
  const loggerOptions = {
    level: env.LOG_LEVEL || 'info',
    redact: {
      paths: redactPaths,
      censor: '[REDACTED]',
    },
    base: {
      service: 'mr-mega-mart-backend',
      environment: env.NODE_ENV,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  }
  logger = pino(loggerOptions)
} catch (_) {
  logger = {
    info: (...args) => console.log('[INFO]', ...args),
    error: (...args) => console.error('[ERROR]', ...args),
    warn: (...args) => console.warn('[WARN]', ...args),
    debug: (...args) => console.debug('[DEBUG]', ...args),
  }
}

module.exports = logger
