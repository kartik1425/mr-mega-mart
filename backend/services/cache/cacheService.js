const { createRedisClient, isRedisReady } = require('../redisClient')

class CacheService {
  constructor() {
    this.redis = createRedisClient()
  }

  isAvailable() {
    return isRedisReady()
  }

  async get(key) {
    if (!this.isAvailable()) return null
    try {
      const data = await this.redis.get(key)
      if (!data) return null
      return JSON.parse(data)
    } catch (err) {
      console.warn(`[CacheService] Failed GET key "${key}":`, err.message)
      return null
    }
  }

  async set(key, value, ttlSeconds = 600) {
    if (!this.isAvailable()) return false
    try {
      const serialized = JSON.stringify(value)
      if (ttlSeconds && ttlSeconds > 0) {
        await this.redis.set(key, serialized, 'EX', ttlSeconds)
      } else {
        await this.redis.set(key, serialized)
      }
      return true
    } catch (err) {
      console.warn(`[CacheService] Failed SET key "${key}":`, err.message)
      return false
    }
  }

  async del(key) {
    if (!this.isAvailable()) return false
    try {
      await this.redis.del(key)
      return true
    } catch (err) {
      console.warn(`[CacheService] Failed DEL key "${key}":`, err.message)
      return false
    }
  }

  async delPattern(pattern) {
    if (!this.isAvailable()) return false
    try {
      const stream = this.redis.scanStream({
        match: pattern,
        count: 100,
      })

      stream.on('data', (keys) => {
        if (keys.length) {
          const pipeline = this.redis.pipeline()
          keys.forEach((key) => pipeline.del(key))
          pipeline.exec()
        }
      })

      return true
    } catch (err) {
      console.warn(`[CacheService] Failed DEL pattern "${pattern}":`, err.message)
      return false
    }
  }
}

module.exports = new CacheService()
