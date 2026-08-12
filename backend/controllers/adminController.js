const User = require('../models/User')
const Product = require('../models/Product')
const Order = require('../models/Order')
const Category = require('../models/Category')
const Deal = require('../models/Deal')
const Review = require('../models/Review')
const Subscription = require('../models/Subscription')
const Trial = require('../models/Trial')
const TrendingSearch = require('../models/TrendingSearch')
const { ALLOWED_TRANSITIONS } = require('./orderController')
const { logger } = require('../services/logger')
const { getRedisClient, isRedisReady } = require('../services/redisClient')

// Helper function for Redis cache invalidation
async function invalidateProductCache(productId) {
  if (isRedisReady()) {
    try {
      const redis = getRedisClient()
      if (productId) {
        await redis.del(`mrmm:product:${productId}`)
      }
      // Also delete category/product listing caches if key pattern matches
      logger.info({ event: 'redis_cache_invalidated', productId }, 'Invalidated catalog cache')
    } catch (err) {
      logger.warn({ event: 'redis_cache_invalidation_error', error: err.message }, 'Failed to invalidate catalog cache')
    }
  }
}

// 1. DASHBOARD METRICS
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

// 2. PRODUCT MANAGEMENT (CRUD & STOCK)
exports.getAdminProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1
    const limit = parseInt(req.query.limit, 10) || 50
    const skip = (page - 1) * limit
    const search = req.query.search ? req.query.search.trim() : ''
    const category = req.query.category ? req.query.category.trim() : ''
    const stockStatus = req.query.stockStatus ? req.query.stockStatus.trim() : ''
    const sortBy = req.query.sortBy ? req.query.sortBy.trim() : 'newest'

    const query = {}
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ]
    }

    if (category) {
      query.category = category
    }

    if (stockStatus === 'out_of_stock') {
      query.stockCount = { $lte: 0 }
    } else if (stockStatus === 'low_stock') {
      query.stockCount = { $gt: 0, $lte: 5 }
    } else if (stockStatus === 'in_stock') {
      query.stockCount = { $gt: 5 }
    }

    let sortOptions = { createdAt: -1 }
    if (sortBy === 'price_asc') sortOptions = { price: 1 }
    if (sortBy === 'price_desc') sortOptions = { price: -1 }
    if (sortBy === 'stock_asc') sortOptions = { stockCount: 1 }
    if (sortBy === 'stock_desc') sortOptions = { stockCount: -1 }

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
    ])

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

exports.createProduct = async (req, res) => {
  try {
    const { title, description, price, oldPrice, salePrice, stockCount, category, imageURLs, tags, cargoWeight } = req.body

    if (!title || !description || price === undefined || !category || !imageURLs || !Array.isArray(imageURLs) || imageURLs.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: title, description, price, category, and at least one imageURL.',
      })
    }

    if (price < 0 || (stockCount !== undefined && stockCount < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Price and stock count must be non-negative numbers.',
      })
    }

    const product = new Product({
      title: title.trim(),
      description: description.trim(),
      price: Number(price),
      oldPrice: oldPrice ? Number(oldPrice) : null,
      salePrice: salePrice ? Number(salePrice) : null,
      stockCount: stockCount !== undefined ? Number(stockCount) : 0,
      category,
      imageURLs,
      tags: Array.isArray(tags) ? tags : [],
      cargoWeight: cargoWeight !== undefined ? Number(cargoWeight) : 0,
    })

    await product.save()
    await invalidateProductCache(product._id)

    logger.info({ event: 'admin_product_created', productId: product._id, title: product.title }, 'Product created by admin')

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product,
    })
  } catch (error) {
    logger.error({ event: 'admin_create_product_error', error: error.message }, 'Error creating product')
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message,
    })
  }
}

exports.updateProduct = async (req, res) => {
  try {
    const { productId } = req.params
    const updates = { ...req.body }

    if (updates.price !== undefined && updates.price < 0) {
      return res.status(400).json({ success: false, message: 'Price cannot be negative.' })
    }
    if (updates.stockCount !== undefined && updates.stockCount < 0) {
      return res.status(400).json({ success: false, message: 'Stock count cannot be negative.' })
    }

    const product = await Product.findByIdAndUpdate(productId, { $set: updates }, { new: true, runValidators: true })

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' })
    }

    await invalidateProductCache(productId)
    logger.info({ event: 'admin_product_updated', productId }, 'Product updated by admin')

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product,
    })
  } catch (error) {
    logger.error({ event: 'admin_update_product_error', error: error.message }, 'Error updating product')
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error.message,
    })
  }
}

exports.deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params

    const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' })
    }

    // Check if referenced in pending or shipping orders
    const activeOrderCount = await Order.countDocuments({
      'items.productId': productId,
      status: { $in: ['pending', 'shipping'] },
    })

    if (activeOrderCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete product. It is currently included in ${activeOrderCount} active order(s).`,
      })
    }

    await Product.findByIdAndDelete(productId)
    await invalidateProductCache(productId)

    logger.info({ event: 'admin_product_deleted', productId, title: product.title }, 'Product deleted by admin')

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    })
  } catch (error) {
    logger.error({ event: 'admin_delete_product_error', error: error.message }, 'Error deleting product')
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message,
    })
  }
}

exports.updateProductStock = async (req, res) => {
  try {
    const adminUserId = req.user.id
    const { productId } = req.params
    const { stockCount, mode = 'set', quantity } = req.body

    const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' })
    }

    let newStock = product.stockCount
    if (mode === 'add') {
      const addQty = parseInt(quantity !== undefined ? quantity : stockCount, 10) || 0
      newStock += addQty
    } else if (mode === 'subtract') {
      const subQty = parseInt(quantity !== undefined ? quantity : stockCount, 10) || 0
      newStock -= subQty
    } else {
      newStock = parseInt(stockCount, 10)
    }

    if (isNaN(newStock) || newStock < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid non-negative stock count is required.',
      })
    }

    product.stockCount = newStock
    await product.save()
    await invalidateProductCache(productId)

    logger.info({ event: 'admin_inventory_updated', adminUserId, productId, newStock }, 'Product stock updated by admin')

    res.status(200).json({
      success: true,
      message: 'Product inventory updated successfully',
      product,
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

// 3. CATEGORY MANAGEMENT (CRUD & HIERARCHY SAFETY)
exports.getAllCategoriesAdmin = async (req, res) => {
  try {
    const categories = await Category.find({})
      .populate('parentCategory', 'name')
      .sort({ name: 1 })
      .lean()

    const productCounts = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ])

    const countMap = {}
    productCounts.forEach((item) => {
      if (item._id) countMap[item._id.toString()] = item.count
    })

    const categoriesWithCount = categories.map((cat) => ({
      ...cat,
      productCount: countMap[cat._id.toString()] || 0,
    }))

    res.status(200).json({
      success: true,
      categories: categoriesWithCount,
    })
  } catch (error) {
    logger.error({ event: 'admin_categories_error', error: error.message }, 'Error fetching admin categories')
    res.status(500).json({ success: false, message: 'Failed to fetch categories', error: error.message })
  }
}

exports.createCategory = async (req, res) => {
  try {
    const { name, description, parentCategory, isActive } = req.body

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required.' })
    }

    const existing = await Category.findOne({ name: name.trim() })
    if (existing) {
      return res.status(400).json({ success: false, message: 'Category with this name already exists.' })
    }

    const category = new Category({
      name: name.trim(),
      description: description ? description.trim() : '',
      parentCategory: parentCategory || null,
      isActive: isActive !== undefined ? isActive : true,
    })

    await category.save()
    logger.info({ event: 'admin_category_created', categoryId: category._id, name: category.name }, 'Category created by admin')

    res.status(201).json({ success: true, message: 'Category created successfully', category })
  } catch (error) {
    logger.error({ event: 'admin_create_category_error', error: error.message }, 'Error creating category')
    res.status(500).json({ success: false, message: 'Failed to create category', error: error.message })
  }
}

exports.updateCategory = async (req, res) => {
  try {
    const { categoryId } = req.params
    const { name, description, parentCategory, isActive } = req.body

    const category = await Category.findById(categoryId)
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' })
    }

    if (name) category.name = name.trim()
    if (description !== undefined) category.description = description.trim()
    if (parentCategory !== undefined) category.parentCategory = parentCategory || null
    if (isActive !== undefined) category.isActive = Boolean(isActive)

    await category.save()
    logger.info({ event: 'admin_category_updated', categoryId }, 'Category updated by admin')

    res.status(200).json({ success: true, message: 'Category updated successfully', category })
  } catch (error) {
    logger.error({ event: 'admin_update_category_error', error: error.message }, 'Error updating category')
    res.status(500).json({ success: false, message: 'Failed to update category', error: error.message })
  }
}

exports.deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.params

    const productCount = await Product.countDocuments({ category: categoryId })
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. There are ${productCount} product(s) assigned to this category. Please reassign or delete them first.`,
        productCount,
      })
    }

    const childCount = await Category.countDocuments({ parentCategory: categoryId })
    if (childCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It has ${childCount} child subcategories attached to it.`,
        childCount,
      })
    }

    await Category.findByIdAndDelete(categoryId)
    logger.info({ event: 'admin_category_deleted', categoryId }, 'Category deleted by admin')

    res.status(200).json({ success: true, message: 'Category deleted successfully' })
  } catch (error) {
    logger.error({ event: 'admin_delete_category_error', error: error.message }, 'Error deleting category')
    res.status(500).json({ success: false, message: 'Failed to delete category', error: error.message })
  }
}

// 4. DEALS MANAGEMENT (CRUD)
exports.getAllDealsAdmin = async (req, res) => {
  try {
    const deals = await Deal.find({}).sort({ dealOrder: 1 }).lean()
    res.status(200).json({ success: true, deals })
  } catch (error) {
    logger.error({ event: 'admin_deals_error', error: error.message }, 'Error fetching deals')
    res.status(500).json({ success: false, message: 'Failed to fetch deals', error: error.message })
  }
}

exports.createDeal = async (req, res) => {
  try {
    const { dealOrder, imageUrl, title, description, action, aspectRatio } = req.body

    if (dealOrder === undefined || !imageUrl || !title || !action) {
      return res.status(400).json({ success: false, message: 'dealOrder, imageUrl, title, and action are required.' })
    }

    const deal = new Deal({
      dealOrder: Number(dealOrder),
      imageUrl,
      title: title.trim(),
      description: description ? description.trim() : '',
      action: action.trim(),
      aspectRatio: aspectRatio || '16:9',
    })

    await deal.save()
    logger.info({ event: 'admin_deal_created', dealId: deal._id, title: deal.title }, 'Deal created by admin')

    res.status(201).json({ success: true, message: 'Deal created successfully', deal })
  } catch (error) {
    logger.error({ event: 'admin_create_deal_error', error: error.message }, 'Error creating deal')
    res.status(500).json({ success: false, message: 'Failed to create deal', error: error.message })
  }
}

exports.updateDeal = async (req, res) => {
  try {
    const { dealId } = req.params
    const deal = await Deal.findByIdAndUpdate(dealId, { $set: req.body }, { new: true, runValidators: true })

    if (!deal) {
      return res.status(404).json({ success: false, message: 'Deal not found.' })
    }

    res.status(200).json({ success: true, message: 'Deal updated successfully', deal })
  } catch (error) {
    logger.error({ event: 'admin_update_deal_error', error: error.message }, 'Error updating deal')
    res.status(500).json({ success: false, message: 'Failed to update deal', error: error.message })
  }
}

exports.deleteDeal = async (req, res) => {
  try {
    const { dealId } = req.params
    await Deal.findByIdAndDelete(dealId)
    res.status(200).json({ success: true, message: 'Deal deleted successfully' })
  } catch (error) {
    logger.error({ event: 'admin_delete_deal_error', error: error.message }, 'Error deleting deal')
    res.status(500).json({ success: false, message: 'Failed to delete deal', error: error.message })
  }
}

// 5. ORDER MANAGEMENT & STATE MACHINE
exports.getAdminOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1
    const limit = parseInt(req.query.limit, 10) || 50
    const skip = (page - 1) * limit
    const status = req.query.status ? req.query.status.trim() : ''
    const search = req.query.search ? req.query.search.trim() : ''

    const query = {}
    if (status) {
      query.status = status
    }

    if (search) {
      if (search.match(/^[0-9a-fA-F]{24}$/)) {
        query._id = search
      }
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('userId', 'userFirstName userLastName email')
        .populate('deliveryAddress', 'fullName phoneNumber address city state postalCode country addressType isDefault')
        .populate('items.productId', 'title imageURLs price salePrice cargoWeight category')
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

exports.getAdminOrderById = async (req, res) => {
  try {
    const { orderId } = req.params
    const order = await Order.findById(orderId)
      .populate('userId', 'userFirstName userLastName email')
      .populate('deliveryAddress', 'fullName phoneNumber address city state postalCode country addressType isDefault')
      .populate('items.productId', 'title imageURLs price salePrice cargoWeight category')
      .lean()

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      })
    }

    res.status(200).json({
      success: true,
      order,
    })
  } catch (error) {
    logger.error({ event: 'admin_order_details_error', error: error.message, orderId: req.params.orderId }, 'Error fetching admin order details')
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order details',
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

// 6. CUSTOMER MANAGEMENT
exports.getAdminUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1
    const limit = parseInt(req.query.limit, 10) || 50
    const skip = (page - 1) * limit
    const search = req.query.search ? req.query.search.trim() : ''

    const query = {}
    if (search) {
      query.$or = [
        { userFirstName: { $regex: search, $options: 'i' } },
        { userLastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ]
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('_id userFirstName userLastName email emailVerified role createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ])

    res.status(200).json({
      success: true,
      users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit) || 1,
      },
    })
  } catch (error) {
    logger.error({ event: 'admin_users_error', error: error.message }, 'Error fetching users')
    res.status(500).json({ success: false, message: 'Failed to fetch customer list', error: error.message })
  }
}

exports.updateUserStatusAdmin = async (req, res) => {
  try {
    const { userId } = req.params
    const { role, emailVerified } = req.body

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' })
    }

    if (role && ['customer', 'admin'].includes(role)) {
      user.role = role
    }
    if (emailVerified !== undefined) {
      user.emailVerified = Boolean(emailVerified)
    }

    await user.save()
    logger.info({ event: 'admin_user_updated', userId, newRole: user.role }, 'User status updated by admin')

    res.status(200).json({
      success: true,
      message: 'User status updated successfully',
      user: {
        _id: user._id,
        userFirstName: user.userFirstName,
        userLastName: user.userLastName,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
      },
    })
  } catch (error) {
    logger.error({ event: 'admin_update_user_error', error: error.message }, 'Error updating user')
    res.status(500).json({ success: false, message: 'Failed to update user', error: error.message })
  }
}

// 7. REVIEW MODERATION
exports.getAdminReviews = async (req, res) => {
  try {
    const reviews = await Review.find({})
      .populate('productId', 'title imageURLs')
      .populate('userId', 'userFirstName userLastName email')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()

    res.status(200).json({ success: true, reviews })
  } catch (error) {
    logger.error({ event: 'admin_reviews_error', error: error.message }, 'Error fetching reviews')
    res.status(500).json({ success: false, message: 'Failed to fetch reviews', error: error.message })
  }
}

exports.deleteReviewAdmin = async (req, res) => {
  try {
    const { reviewId } = req.params

    const review = await Review.findById(reviewId)
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' })
    }

    const productId = review.productId
    await Review.findByIdAndDelete(reviewId)

    // Recalculate average rating & review count
    const stats = await Review.aggregate([
      { $match: { productId } },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
    ])

    const avgRating = stats.length > 0 ? stats[0].avgRating : 0
    const count = stats.length > 0 ? stats[0].count : 0

    await Product.findByIdAndUpdate(productId, {
      averageRating: Number(avgRating.toFixed(1)),
      reviewCount: count,
    })

    await invalidateProductCache(productId)
    logger.info({ event: 'admin_review_deleted', reviewId, productId }, 'Review deleted by admin')

    res.status(200).json({ success: true, message: 'Review deleted successfully' })
  } catch (error) {
    logger.error({ event: 'admin_delete_review_error', error: error.message }, 'Error deleting review')
    res.status(500).json({ success: false, message: 'Failed to delete review', error: error.message })
  }
}

// 8. SUBSCRIPTIONS & TRIALS OVERVIEW
exports.getAdminSubscriptions = async (req, res) => {
  try {
    const [subscriptions, trials] = await Promise.all([
      Subscription.find({})
        .populate('userId', 'userFirstName userLastName email')
        .sort({ createdAt: -1 })
        .lean(),
      Trial.find({})
        .populate('userId', 'userFirstName userLastName email')
        .populate('trialProductId')
        .sort({ createdAt: -1 })
        .lean(),
    ])

    res.status(200).json({
      success: true,
      subscriptions,
      trials,
    })
  } catch (error) {
    logger.error({ event: 'admin_subscriptions_error', error: error.message }, 'Error fetching subscriptions')
    res.status(500).json({ success: false, message: 'Failed to fetch subscriptions', error: error.message })
  }
}


