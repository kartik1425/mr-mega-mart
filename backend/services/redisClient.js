const Redis = require('ioredis')
const env = require('../config/env')
const { logger } = require('./logger')

let redis = null
let isConnected = false

function createRedisClient() {
  if (!env.USE_REDIS) {
    logger.info({ event: 'redis_disabled' }, '[Redis] Redis is disabled via configuration (USE_REDIS=false)')
    return null
  }

  if (!redis) {
    const options = {
      maxRetriesPerRequest: 1,
      retryStrategy(times) {
        if (times > 3) {
          logger.warn({ event: 'redis_retry_exhausted' }, '[Redis] Connection retries exhausted. Disabling active retry.')
          return null
        }
        return Math.min(times * 200, 2000)
      },
      enableOfflineQueue: false,
    }

    try {
      if (env.REDIS_URL) {
        redis = new Redis(env.REDIS_URL, options)
      } else {
        redis = new Redis({
          host: env.REDIS_HOST,
          port: env.REDIS_PORT,
          password: env.REDIS_PASSWORD || undefined,
          ...options,
        })
      }

      redis.on('connect', () => {
        isConnected = true
        logger.info({ event: 'redis_connected', host: env.REDIS_HOST, port: env.REDIS_PORT }, '[Redis] Connected successfully')
      })

      redis.on('ready', () => {
        isConnected = true
      })

      redis.on('error', (err) => {
        isConnected = false
        logger.warn({ event: 'redis_error', error: err.message }, `[Redis] Redis error (failing open to MongoDB): ${err.message}`)
      })

      redis.on('close', () => {
        isConnected = false
        logger.warn({ event: 'redis_disconnected' }, '[Redis] Connection closed')
      })
    } catch (err) {
      logger.warn({ event: 'redis_init_error', error: err.message }, `[Redis] Initialization error (failing open to MongoDB): ${err.message}`)
      redis = null
      isConnected = false
    }
  }
  return redis
}

function isRedisReady() {
  return env.USE_REDIS && redis && isConnected
}

module.exports = {
  createRedisClient,
  isRedisReady,
  getRedisClient: () => redis,
}