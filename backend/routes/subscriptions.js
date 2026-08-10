const express = require('express')
const router = express.Router()
const { verifyToken } = require('../middleware/verifyToken')
const subscriptionController = require('../controllers/subscriptionController')
const validate = require('../middleware/validate')
const { validateObjectId } = require('../validators/commonValidator')

router.post('/create', verifyToken, subscriptionController.createSubscription)

router.delete('/cancel/:subscriptionId', verifyToken, validateObjectId('subscriptionId'), validate, subscriptionController.cancelSubscription)

router.get('/status', verifyToken, subscriptionController.getSubscriptionStatus)

module.exports = router