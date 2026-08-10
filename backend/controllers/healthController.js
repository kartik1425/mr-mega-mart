const mongoose = require('mongoose')
const env = require('../config/env')
const paymentService = require('../services/payment')
const { isRedisReady } = require('../services/redisClient')
const { metrics } = require('../services/logger')

exports.getHealthStatus = async (req, res) => {
  const dbState = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  const redisState = !env.USE_REDIS ? 'disabled' : isRedisReady() ? 'connected' : 'disconnected'
  const paymentProvider = paymentService.getProviderName()

  const isHealthy = dbState === 'connected'

  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    status: isHealthy ? 'healthy' : 'unhealthy',
    service: 'mr-mega-mart-backend',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
    checks: {
      database: dbState,
      redis: redisState,
      payment: paymentProvider,
    },
    metrics: metrics.getMetrics(),
  })
}
