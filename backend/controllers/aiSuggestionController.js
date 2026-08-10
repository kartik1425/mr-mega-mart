const { getSuggestedProducts } = require('../ai/generateSuggestions')
const { getRedisClient, isRedisReady } = require('../services/redisClient')
const { logger } = require('../services/logger')

const RECOMMENDATION_CACHE_TTL = 300 // 5 minutes

exports.getProductSuggestions = async (req, res) => {
  try {
    const userId = req.user.id
    const cacheKey = `mrmm:recommendations:${userId}`

    // 1. Try serving from Redis cache
    if (isRedisReady()) {
      try {
        const redis = getRedisClient()
        const cachedData = await redis.get(cacheKey)
        if (cachedData) {
          logger.info({ event: 'recommendations_cache_hit', userId }, 'Served product recommendations from Redis cache')
          return res.status(200).json({
            success: true,
            products: JSON.parse(cachedData),
            cached: true,
          })
        }
      } catch (cacheErr) {
        logger.warn({ event: 'recommendations_cache_read_error', userId, error: cacheErr.message }, 'Failed to read recommendations from Redis cache')
      }
    }

    // 2. Compute recommendations via First-Party Engine
    const products = await getSuggestedProducts(userId)

    // 3. Cache generated recommendations in Redis
    if (isRedisReady() && products && products.length > 0) {
      try {
        const redis = getRedisClient()
        await redis.set(cacheKey, JSON.stringify(products), 'EX', RECOMMENDATION_CACHE_TTL)
        logger.info({ event: 'recommendations_cached', userId, ttl: RECOMMENDATION_CACHE_TTL }, 'Cached recommendations in Redis')
      } catch (cacheWriteErr) {
        logger.warn({ event: 'recommendations_cache_write_error', userId, error: cacheWriteErr.message }, 'Failed to write recommendations to Redis cache')
      }
    }

    res.status(200).json({
      success: true,
      products,
    })
  } catch (error) {
    logger.error({ event: 'get_product_suggestions_error', requestId: req.id, error: error.message }, 'Error fetching product suggestions')
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product suggestions.',
      error: error.message,
    })
  }
}