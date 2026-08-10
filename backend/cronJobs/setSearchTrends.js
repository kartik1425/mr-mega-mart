const SearchTerm = require('../models/SearchTerm')
const TrendingSearch = require('../models/TrendingSearch')
const { logger } = require('../services/logger')
const { getRedisClient, isRedisReady } = require('../services/redisClient')

const setSearchTrends = async () => {
  const startTime = performance.now()
  logger.info({ event: 'cron_started', job: 'setSearchTrends' }, 'Starting setSearchTrends cron job')

  try {
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

    // Normalize search terms: Trim, lowercase, filter length >= 2
    const searchTerms = await SearchTerm.aggregate([
      {
        $match: {
          createdAt: { $gte: oneMonthAgo },
        },
      },
      {
        $project: {
          normalizedSearchTerm: { $toLower: { $trim: { input: '$searchTerm' } } },
        },
      },
      {
        $match: {
          normalizedSearchTerm: { $regex: /^.{2,}$/ }, // Minimum 2 characters
        },
      },
      {
        $group: {
          _id: '$normalizedSearchTerm',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ])

    const trendingSearches = searchTerms.map((term) => ({
      trendingSearchTerm: term._id,
      occurrenceCount: term.count,
    }))

    await TrendingSearch.deleteMany({})
    if (trendingSearches.length > 0) {
      await TrendingSearch.insertMany(trendingSearches)
    }

    // Invalidate Redis Cache
    if (isRedisReady()) {
      try {
        const redis = getRedisClient()
        await redis.del('mrmm:trendingSearches')
        logger.info({ event: 'redis_cache_invalidated', key: 'mrmm:trendingSearches' }, 'Invalidated trending searches cache')
      } catch (err) {
        logger.warn({ event: 'redis_cache_invalidation_error', error: err.message }, 'Failed to invalidate trending searches cache')
      }
    }

    const durationMs = Math.round(performance.now() - startTime)
    logger.info({ event: 'cron_completed', job: 'setSearchTrends', durationMs, count: trendingSearches.length }, `setSearchTrends completed successfully in ${durationMs}ms`)
  } catch (error) {
    const durationMs = Math.round(performance.now() - startTime)
    logger.error({ event: 'cron_failed', job: 'setSearchTrends', durationMs, error: error.message }, 'Error running setSearchTrends cron job')
  }
}

module.exports = setSearchTrends