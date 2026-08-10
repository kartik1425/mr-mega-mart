const express = require('express')
const router = express.Router()
const adminController = require('../controllers/adminController')
const { verifyAdmin } = require('../middleware/verifyToken')
const validate = require('../middleware/validate')
const { validateObjectId } = require('../validators/commonValidator')

router.get('/metrics', verifyAdmin, adminController.getAdminMetrics)
router.get('/products', verifyAdmin, adminController.getAdminProducts)
router.get('/orders', verifyAdmin, adminController.getAdminOrders)

router.put(
  '/products/:productId/stock',
  verifyAdmin,
  validateObjectId('productId'),
  validate,
  adminController.updateProductStock
)

router.put(
  '/orders/:orderId/status',
  verifyAdmin,
  validateObjectId('orderId'),
  validate,
  adminController.updateOrderStatusAdmin
)

module.exports = router
