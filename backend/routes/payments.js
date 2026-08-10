const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const paymentController = require('../controllers/paymentController')
const { verifyToken } = require('../middleware/verifyToken')
const stripeWebhookController = require('../controllers/stripeWebhookController')
const validate = require('../middleware/validate')
const { checkOrderStatusValidator } = require('../validators/trialValidator')

router.post('/create-payment-intent', verifyToken, paymentController.createPaymentIntent)

router.get('/check-order-status', verifyToken, checkOrderStatusValidator, validate, paymentController.checkOrderStatus)

router.post(
  '/webhook',
  bodyParser.raw({ type: 'application/json' }),
  stripeWebhookController.handleStripeWebhook
)

module.exports = router