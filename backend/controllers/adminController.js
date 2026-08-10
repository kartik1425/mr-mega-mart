const User = require('../models/User')
const Product = require('../models/Product')
const Order = require('../models/Order')
const Subscription = require('../models/Subscription')
const TrendingSearch = require('../models/TrendingSearch')
const BestOfProduct = require('../models/BestOfProduct')
const { ALLOWED_TRANSITIONS } = require('./orderController')
const { logger } = require('../services/logger')
const { getRedisClient, isRedisReady } = require('../services/redisClient')

exports.getAdminMetrics = async (req, res) => {
  const startTime = performance.now()
  try {
    const adminUserId = req.user.id
    logger.info({ event: 'admin_metrics_accessed', adminUserId, requestId: req.id }, 'Admin metrics endpoint accessed')

    const now = new Date()
    const startOfToday = new Date(now.setHours(0, 0, 0, 0))

    const [
      totalUsers,
      subscribedUsers,
      totalProducts,
      outOfStockProducts,
      lowStockProducts,
      orderCounts,
      totalRevenueResult,
      todayRevenueResult,
      trendingCount,
    ] = await Promise.all([
      User.countDocuments({}),
      Subscription.countDocuments({ isActive: true, status: 'active', expiresAt: { $gt: new Date() } }),
      Product.countDocuments({}),
      Product.countDocuments({ stockCount: { $lte: 0 } }),
      Product.countDocuments({ stockCount: { $gt: 0, $lte: 5 } }),
      Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Order.aggregate([
        { $match: { status: { $in: ['pending', 'shipping', 'delivered'] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Order.aggregate([
        { $match: { status: { $in: ['pending', 'shipping', 'delivered'] }, createdAt: { $gte: startOfToday } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      TrendingSearch.countDocuments({}),
    ])

    const orderStatusMap = {
      pending: 0,
      shipping: 0,
      delivered: 0,
      cancelled: 0,
      failed: 0,
      returned: 0,
    }

    let totalOrdersCount = 0
    orderCounts.forEach((item) => {
      if (item._id && orderStatusMap[item._id] !== undefined) {
        orderStatusMap[item._id] = item.count
      }
      totalOrdersCount += item.count
    })

    const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0
    const todayRevenue = todayRevenueResult.length > 0 ? todayRevenueResult[0].total : 0

    const dbLatencyMs = Math.round(performance.now() - startTime)

    res.status(200).json({
      success: true,
      metrics: {
        users: {
          totalUsers,
          subscribedUsers,
        },
        products: {
          totalProducts,
          outOfStockProducts,
          lowStockProducts,
        },
        orders: {
          totalOrders: totalOrdersCount,
          pending: orderStatusMap.pending,
          shipping: orderStatusMap.shipping,
          delivered: orderStatusMap.delivered,
          cancelled: orderStatusMap.cancelled,
          failed: orderStatusMap.failed,
          returned: orderStatusMap.returned,
        },
        revenue: {
          totalRevenue,
          todayRevenue,
        },
        trends: {
          trendingSearchesCount: trendingCount,
        },
      },
      dbLatencyMs,
    })
  } catch (error) {
    logger.error({ event: 'admin_metrics_error', requestId: req.id, error: error.message }, 'Error fetching admin metrics')
    res.status(500).json({
      success: false,
      message: 'Failed to fetch administrative metrics',
      error: error.message,
    })
  }
}

exports.updateProductStock = async (req, res) => {
  try {
    const adminUserId = req.user.id
    const { productId } = req.params
    const { stockCount } = req.body

    if (stockCount === undefined || typeof stockCount !== 'number' || stockCount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid non-negative stockCount is required.',
      })
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { $set: { stockCount } },
      { new: true, runValidators: true }
    )

    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      })
    }

    // Invalidate Redis catalog cache
    if (isRedisReady()) {
      try {
        const redis = getRedisClient()
        await redis.del(`mrmm:product:${productId}`)
        logger.info({ event: 'redis_cache_invalidated', key: `mrmm:product:${productId}` }, 'Invalidated product cache')
      } catch (err) {
        logger.warn({ event: 'redis_cache_invalidation_error', error: err.message }, 'Failed to invalidate product cache')
      }
    }

    logger.info({ event: 'admin_inventory_updated', adminUserId, productId, newStock: stockCount }, 'Product stock updated by admin')

    res.status(200).json({
      success: true,
      message: 'Product inventory updated successfully',
      product: updatedProduct,
    })
  } catch (error) {
    logger.error({ event: 'admin_update_stock_error', requestId: req.id, error: error.message }, 'Error updating product stock')
    res.status(500).json({
      success: false,
      message: 'Failed to update product inventory',
      error: error.message,
    })
  }
}

exports.updateOrderStatusAdmin = async (req, res) => {
  try {
    const adminUserId = req.user.id
    const { orderId } = req.params
    const { status } = req.body

    const order = await Order.findById(orderId)
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      })
    }

    const allowed = ALLOWED_TRANSITIONS[order.status] || []
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid state transition from "${order.status}" to "${status}"`,
      })
    }

    order.status = status
    await order.save()

    logger.info({ event: 'admin_order_status_updated', adminUserId, orderId, newStatus: status }, 'Order status updated by admin')

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      order,
    })
  } catch (error) {
    logger.error({ event: 'admin_update_order_status_error', requestId: req.id, error: error.message }, 'Error updating order status')
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message,
    })
  }
}

exports.getAdminProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1
    const limit = parseInt(req.query.limit, 10) || 50
    const skip = (page - 1) * limit
    const search = req.query.search ? req.query.search.trim() : ''

    const query = {}
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ]
    }

    const [products, total] = await Promise.all([
      Product.find(query)
        .select('_id title price stockCount category image rating productNumber createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
    ])

    logger.info({ event: 'admin_products_accessed', adminUserId: req.user.id, count: products.length }, 'Admin product listing accessed')

    res.status(200).json({
      success: true,
      products,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit) || 1,
      },
    })
  } catch (error) {
    logger.error({ event: 'admin_products_error', error: error.message }, 'Error fetching admin products')
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin product list',
      error: error.message,
    })
  }
}

exports.getAdminOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1
    const limit = parseInt(req.query.limit, 10) || 50
    const skip = (page - 1) * limit
    const status = req.query.status ? req.query.status.trim() : ''

    const query = {}
    if (status) {
      query.status = status
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('userId', 'userFirstName userLastName email')
        .populate('deliveryAddress', 'street city state zipCode country')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(query),
    ])

    logger.info({ event: 'admin_orders_accessed', adminUserId: req.user.id, count: orders.length }, 'Admin order listing accessed')

    res.status(200).json({
      success: true,
      orders,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit) || 1,
      },
    })
  } catch (error) {
    logger.error({ event: 'admin_orders_error', error: error.message }, 'Error fetching admin orders')
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin order list',
      error: error.message,
    })
  }
}

