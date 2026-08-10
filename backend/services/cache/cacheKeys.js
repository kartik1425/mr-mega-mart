/**
 * Centralized Cache Key Generator for MR Mega Mart
 * Key format: mrmm:<domain>:<identifier or parameters>
 */

const PREFIX = 'mrmm'

const cacheKeys = {
  // Categories
  rootCategories: () => `${PREFIX}:categories:root`,
  childCategories: (parentId) => `${PREFIX}:categories:children:${parentId}`,
  categoryDescendants: (categoryId) => `${PREFIX}:categories:descendants:${categoryId}`,

  // Deals
  dealsList: () => `${PREFIX}:deals:list`,

  // Products
  bestOfProducts: (period, page, limit) => `${PREFIX}:products:best:${period}:${page}:${limit}`,
  productsByCategory: (categoryId, queryParams) => {
    const serialized = Object.keys(queryParams)
      .sort()
      .map((key) => `${key}=${queryParams[key]}`)
      .join('&')
    return `${PREFIX}:products:category:${categoryId}:${serialized}`
  },
  productSearch: (query, queryParams) => {
    const normalized = (query || '').toLowerCase().trim()
    const serialized = Object.keys(queryParams)
      .sort()
      .map((key) => `${key}=${queryParams[key]}`)
      .join('&')
    return `${PREFIX}:products:search:${normalized}:${serialized}`
  },
  productDetail: (productId) => `${PREFIX}:products:detail:${productId}`,

  // Trial Products
  latestTrialProducts: () => `${PREFIX}:trialProducts:latest`,
  trialProductsByCategory: (categoryId) => `${PREFIX}:trialProducts:category:${categoryId}`,
  trialProductSearch: (query) => `${PREFIX}:trialProducts:search:${(query || '').toLowerCase().trim()}`,
  trialProductDetail: (trialProductId) => `${PREFIX}:trialProducts:detail:${trialProductId}`,

  // Search Trends
  trendingSearches: () => `${PREFIX}:trending:searches`,
}

module.exports = cacheKeys
