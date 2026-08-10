const Order = require('../models/Order')
const Product = require('../models/Product')
const BestOfProduct = require('../models/BestOfProduct')
const { logger } = require('../services/logger')
const { getRedisClient, isRedisReady } = require('../services/redisClient')

const setBestOfMonthProducts = async () => {
  const startTime = performance.now()
  logger.info({ event: 'cron_started', job: 'setBestOfMonthProducts' }, 'Starting setBestOfMonthProducts cron job')

  try {
    const now = new Date()
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    startOfLastMonth.setHours(0, 0, 0, 0)

    const endDate = new Date()
    endDate.setHours(23, 59, 59, 999)

    const mostOrderedProducts = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfLastMonth, $lte: endDate },
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
        .select('averageRating title description tags')
        .sort({ averageRating: -1 })
        .limit(10)

      await BestOfProduct.deleteMany({ period: 'month' })

      const bestOfMonthProducts = new BestOfProduct({
        period: 'month',
        productIds: productsWithRatings.map((p) => p._id),
        startDate: startOfLastMonth,
      })

      await bestOfMonthProducts.save()
    }

    // Invalidate Redis Cache
    if (isRedisReady()) {
      try {
        const redis = getRedisClient()
        await redis.del('mrmm:best-of-month')
        logger.info({ event: 'redis_cache_invalidated', key: 'mrmm:best-of-month' }, 'Invalidated best-of-month cache')
      } catch (err) {
        logger.warn({ event: 'redis_cache_invalidation_error', error: err.message }, 'Failed to invalidate best-of-month cache')
      }
    }

    const durationMs = Math.round(performance.now() - startTime)
    logger.info({ event: 'cron_completed', job: 'setBestOfMonthProducts', durationMs }, `setBestOfMonthProducts completed successfully in ${durationMs}ms`)
  } catch (error) {
    const durationMs = Math.round(performance.now() - startTime)
    logger.error({ event: 'cron_failed', job: 'setBestOfMonthProducts', durationMs, error: error.message }, 'Error running setBestOfMonthProducts cron job')
  }
}

module.exports = setBestOfMonthProducts