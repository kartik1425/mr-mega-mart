const cacheService = require('./cacheService')

/**
 * Cache-Aside Express Middleware Factory
 * @param {Function} keyGenerator Function (req) => string cache key
 * @param {Number} defaultTTL TTL in seconds
 */
const cacheMiddleware = (keyGenerator, defaultTTL = 600) => {
  return async (req, res, next) => {
    // Skip caching if request is not GET or Redis is unavailable
    if (req.method !== 'GET' || !cacheService.isAvailable()) {
      return next()
    }

    try {
      const cacheKey = keyGenerator(req)
      if (!cacheKey) {
        return next()
      }

      const cachedData = await cacheService.get(cacheKey)
      if (cachedData) {
        res.setHeader('X-Cache', 'HIT')
        return res.status(200).json(cachedData)
      }

      // Cache MISS: Intercept res.json to capture and store the payload
      res.setHeader('X-Cache', 'MISS')
      const originalJson = res.json.bind(res)

      res.json = (body) => {
        if (res.statusCode >= 200 && res.statusCode < 300 && body && body.success !== false) {
          cacheService.set(cacheKey, body, defaultTTL).catch((err) => {
            console.warn(`[CacheMiddleware] Background SET failed for key "${cacheKey}":`, err.message)
          })
        }
        return originalJson(body)
      }

      next()
    } catch (err) {
      console.warn('[CacheMiddleware] Error handling cache middleware (failing open):', err.message)
      next()
    }
  }
}

module.exports = cacheMiddleware
