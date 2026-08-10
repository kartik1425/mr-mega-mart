const pino = require('pino')
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

const logger = pino(loggerOptions)

module.exports = logger
