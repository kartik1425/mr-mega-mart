const express = require('express')
const router = express.Router()
const orderController = require('../controllers/orderController')
const { verifyToken } = require('../middleware/verifyToken')
const validate = require('../middleware/validate')
const { validateObjectId } = require('../validators/commonValidator')

router.get('/get-user-orders', verifyToken, orderController.getUserOrders)

router.get('/get-order-details/:orderId', verifyToken, validateObjectId('orderId'), validate, orderController.getOrderDetails)

router.get('/get-latest-order-details', verifyToken, orderController.getLatestOrderDetails)

router.put('/cancel-order/:orderId', verifyToken, validateObjectId('orderId'), validate, orderController.cancelOrder)

module.exports = router