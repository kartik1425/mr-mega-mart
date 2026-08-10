const express = require('express')
const router = express.Router()
const productController = require('../controllers/productController')
const { optionalAuth, verifyToken } = require('../middleware/verifyToken')
const validate = require('../middleware/validate')
const { validateObjectId, paginationValidator } = require('../validators/commonValidator')
const { cacheMiddleware, cacheKeys } = require('../services/cache')
const env = require('../config/env')

router.get(
  '/get-best-of-products',
  optionalAuth,
  cacheMiddleware((req) => cacheKeys.bestOfProducts(req.query.period || 'week', req.query.page || 1, req.query.limit || 10), env.CACHE_PRODUCTS_TTL),
  productController.getBestOfProducts
)

router.get('/liked-products', verifyToken, productController.getLikedProducts)

router.get(
  '/category/:categoryId',
  optionalAuth,
  validateObjectId('categoryId'),
  validate,
  cacheMiddleware((req) => cacheKeys.productsByCategory(req.params.categoryId, req.query), env.CACHE_PRODUCTS_TTL),
  productController.getProductsByCategoryId
)

router.get(
  '/search',
  optionalAuth,
  paginationValidator,
  validate,
  cacheMiddleware((req) => cacheKeys.productSearch(req.query.query, req.query), env.CACHE_SEARCH_TTL),
  productController.searchProducts
)

router.get(
  '/:productId',
  optionalAuth,
  validateObjectId('productId'),
  validate,
  cacheMiddleware((req) => cacheKeys.productDetail(req.params.productId), env.CACHE_PRODUCTS_TTL),
  productController.getSingleProduct
)

module.exports = router