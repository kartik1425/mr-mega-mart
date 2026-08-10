const express = require('express')
const router = express.Router()
const trialProductController = require('../controllers/trialProductController')
const { verifyToken } = require('../middleware/verifyToken')
const validate = require('../middleware/validate')
const { validateObjectId, paginationValidator } = require('../validators/commonValidator')
const { cacheMiddleware, cacheKeys } = require('../services/cache')
const env = require('../config/env')

router.get(
  '/get-latest',
  verifyToken,
  cacheMiddleware(() => cacheKeys.latestTrialProducts(), env.CACHE_PRODUCTS_TTL),
  trialProductController.getLatestTrialProducts
)

router.get(
  '/category/:categoryId',
  validateObjectId('categoryId'),
  validate,
  cacheMiddleware((req) => cacheKeys.trialProductsByCategory(req.params.categoryId), env.CACHE_PRODUCTS_TTL),
  trialProductController.getTrialProductsByCategoryId
)

router.get(
  '/search',
  paginationValidator,
  validate,
  cacheMiddleware((req) => cacheKeys.trialProductSearch(req.query.query), env.CACHE_SEARCH_TTL),
  trialProductController.searchTrialProducts
)

router.get(
  '/:trialProductId',
  validateObjectId('trialProductId'),
  validate,
  cacheMiddleware((req) => cacheKeys.trialProductDetail(req.params.trialProductId), env.CACHE_PRODUCTS_TTL),
  trialProductController.getSingleTrialProduct
)

module.exports = router