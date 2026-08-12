const express = require('express')
const router = express.Router()
const adminController = require('../controllers/adminController')
const { verifyAdmin } = require('../middleware/verifyToken')
const validate = require('../middleware/validate')
const { validateObjectId } = require('../validators/commonValidator')

// Dashboard Metrics
router.get('/metrics', verifyAdmin, adminController.getAdminMetrics)

// Products Management & Stock
router.get('/products', verifyAdmin, adminController.getAdminProducts)
router.post('/products', verifyAdmin, adminController.createProduct)
router.put(
  '/products/:productId',
  verifyAdmin,
  validateObjectId('productId'),
  validate,
  adminController.updateProduct
)
router.delete(
  '/products/:productId',
  verifyAdmin,
  validateObjectId('productId'),
  validate,
  adminController.deleteProduct
)
router.put(
  '/products/:productId/stock',
  verifyAdmin,
  validateObjectId('productId'),
  validate,
  adminController.updateProductStock
)

// Categories Management
router.get('/categories', verifyAdmin, adminController.getAllCategoriesAdmin)
router.post('/categories', verifyAdmin, adminController.createCategory)
router.put(
  '/categories/:categoryId',
  verifyAdmin,
  validateObjectId('categoryId'),
  validate,
  adminController.updateCategory
)
router.delete(
  '/categories/:categoryId',
  verifyAdmin,
  validateObjectId('categoryId'),
  validate,
  adminController.deleteCategory
)

// Deals Management
router.get('/deals', verifyAdmin, adminController.getAllDealsAdmin)
router.post('/deals', verifyAdmin, adminController.createDeal)
router.put(
  '/deals/:dealId',
  verifyAdmin,
  validateObjectId('dealId'),
  validate,
  adminController.updateDeal
)
router.delete(
  '/deals/:dealId',
  verifyAdmin,
  validateObjectId('dealId'),
  validate,
  adminController.deleteDeal
)

// Orders State Machine
router.get('/orders', verifyAdmin, adminController.getAdminOrders)
router.get(
  '/orders/:orderId',
  verifyAdmin,
  validateObjectId('orderId'),
  validate,
  adminController.getAdminOrderById
)
router.put(
  '/orders/:orderId/status',
  verifyAdmin,
  validateObjectId('orderId'),
  validate,
  adminController.updateOrderStatusAdmin
)

// Customer Management
router.get('/users', verifyAdmin, adminController.getAdminUsers)
router.put(
  '/users/:userId/status',
  verifyAdmin,
  validateObjectId('userId'),
  validate,
  adminController.updateUserStatusAdmin
)

// Review Moderation
router.get('/reviews', verifyAdmin, adminController.getAdminReviews)
router.delete(
  '/reviews/:reviewId',
  verifyAdmin,
  validateObjectId('reviewId'),
  validate,
  adminController.deleteReviewAdmin
)

// Subscriptions & Trials Overview
router.get('/subscriptions', verifyAdmin, adminController.getAdminSubscriptions)

module.exports = router
