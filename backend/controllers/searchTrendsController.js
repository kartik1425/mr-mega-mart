const TrendingSearch = require('../models/TrendingSearch')
const { getRedisClient, isRedisReady } = require('../services/redisClient')
const { logger } = require('../services/logger')

const TRENDING_SEARCH_CACHE_TTL = 600 // 10 minutes

exports.getTrendingSearches = async (req, res) => {
  try {
    const cacheKey = 'mrmm:trendingSearches'

    if (isRedisReady()) {
      try {
        const redis = getRedisClient()
        const cachedData = await redis.get(cacheKey)
        if (cachedData) {
          logger.info({ event: 'trending_searches_cache_hit' }, 'Served trending searches from Redis cache')
          return res.status(200).json({
            success: true,
            trendingSearches: JSON.parse(cachedData),
            cached: true,
          })
        }
      } catch (cacheErr) {
        logger.warn({ event: 'trending_searches_cache_read_error', error: cacheErr.message }, 'Failed to read trending searches from Redis cache')
      }
    }

    const trendingSearches = await TrendingSearch.find()
      .sort({ occurrenceCount: -1 })
      .limit(5)
      .select('trendingSearchTerm occurrenceCount')
      .lean()

    if (isRedisReady() && trendingSearches && trendingSearches.length > 0) {
      try {
        const redis = getRedisClient()
        await redis.set(cacheKey, JSON.stringify(trendingSearches), 'EX', TRENDING_SEARCH_CACHE_TTL)
        logger.info({ event: 'trending_searches_cached', ttl: TRENDING_SEARCH_CACHE_TTL }, 'Cached trending searches in Redis')
      } catch (cacheWriteErr) {
        logger.warn({ event: 'trending_searches_cache_write_error', error: cacheWriteErr.message }, 'Failed to write trending searches to Redis cache')
      }
    }

    res.status(200).json({
      success: true,
      trendingSearches,
    })
  } catch (error) {
    logger.error({ event: 'get_trending_searches_error', requestId: req.id, error: error.message }, 'Error fetching trending searches')
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trending searches',
      error: error.message,
    })
  }
}