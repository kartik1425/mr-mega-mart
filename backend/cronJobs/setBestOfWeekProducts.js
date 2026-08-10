const Order = require('../models/Order')
const Product = require('../models/Product')
const BestOfProduct = require('../models/BestOfProduct')
const { logger } = require('../services/logger')
const { getRedisClient, isRedisReady } = require('../services/redisClient')

const setBestOfWeekProducts = async () => {
  const startTime = performance.now()
  logger.info({ event: 'cron_started', job: 'setBestOfWeekProducts' }, 'Starting setBestOfWeekProducts cron job')

  try {
    const now = new Date()
    const startOfLastWeek = new Date(now)
    startOfLastWeek.setDate(now.getDate() - now.getDay() - 7)
    startOfLastWeek.setHours(0, 0, 0, 0)

    const endOfLastWeek = new Date(now)
    endOfLastWeek.setDate(now.getDate() - now.getDay())
    endOfLastWeek.setHours(23, 59, 59, 999)

    const mostOrderedProducts = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfLastWeek, $lte: endOfLastWeek },
          status: { $in: ['pending', 'shipping', 'delivered'] },
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          totalOrders: { $sum: '$items.quantity' },
        },
      },
      { $sort: { totalOrders: -1 } },
      { $limit: 10 },
    ])

    if (mostOrderedProducts.length > 0) {
      const productIds = mostOrderedProducts.map((p) => p._id)

      const productsWithRatings = await Product.find({ _id: { $in: productIds } })
        .select('averageRating')
        .sort({ averageRating: -1 })
        .limit(10)

      await BestOfProduct.deleteMany({ period: 'week' })

      const bestOfWeekProducts = new BestOfProduct({
        period: 'week',
        productIds: productsWithRatings.map((p) => p._id),
        startDate: startOfLastWeek,
      })

      await bestOfWeekProducts.save()
    }

    // Invalidate Redis Cache
    if (isRedisReady()) {
      try {
        const redis = getRedisClient()
        await redis.del('mrmm:best-of-week')
        logger.info({ event: 'redis_cache_invalidated', key: 'mrmm:best-of-week' }, 'Invalidated best-of-week cache')
      } catch (err) {
        logger.warn({ event: 'redis_cache_invalidation_error', error: err.message }, 'Failed to invalidate best-of-week cache')
      }
    }

    const durationMs = Math.round(performance.now() - startTime)
    logger.info({ event: 'cron_completed', job: 'setBestOfWeekProducts', durationMs }, `setBestOfWeekProducts completed successfully in ${durationMs}ms`)
  } catch (error) {
    const durationMs = Math.round(performance.now() - startTime)
    logger.error({ event: 'cron_failed', job: 'setBestOfWeekProducts', durationMs, error: error.message }, 'Error running setBestOfWeekProducts cron job')
  }
}

module.exports = setBestOfWeekProducts