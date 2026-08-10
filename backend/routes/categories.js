const express = require('express')
const router = express.Router()
const categoryController = require('../controllers/categoryController')
const validate = require('../middleware/validate')
const { validateObjectId } = require('../validators/commonValidator')
const { cacheMiddleware, cacheKeys } = require('../services/cache')
const env = require('../config/env')

router.get(
  '/get-root-categories',
  cacheMiddleware(() => cacheKeys.rootCategories(), env.CACHE_CATEGORIES_TTL),
  categoryController.getRootCategories
)

router.get(
  '/get-child-categories/:parentId',
  validateObjectId('parentId'),
  validate,
  cacheMiddleware((req) => cacheKeys.childCategories(req.params.parentId), env.CACHE_CATEGORIES_TTL),
  categoryController.getChildCategories
)

module.exports = router