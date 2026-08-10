const express = require('express')
const router = express.Router()
const dealController = require('../controllers/dealController')
const { cacheMiddleware, cacheKeys } = require('../services/cache')
const env = require('../config/env')

router.get(
  '/get-deals',
  cacheMiddleware(() => cacheKeys.dealsList(), env.CACHE_DEALS_TTL),
  dealController.getDeals
)

module.exports = router