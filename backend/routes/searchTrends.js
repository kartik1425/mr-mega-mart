const express = require('express')
const router = express.Router()
const searchTrendsController = require('../controllers/searchTrendsController')
const { cacheMiddleware, cacheKeys } = require('../services/cache')
const env = require('../config/env')

router.get(
  '/get-trending-searches',
  cacheMiddleware(() => cacheKeys.trendingSearches(), env.CACHE_TRENDING_TTL),
  searchTrendsController.getTrendingSearches
)

module.exports = router