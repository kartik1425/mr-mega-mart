const fs = require('fs')
const path = require('path')
const SearchTerm = require('../models/SearchTerm')
const Order = require('../models/Order')
const Product = require('../models/Product')
const ProductView = require('../models/ProductView')
const Review = require('../models/Review')
const TrendingSearch = require('../models/TrendingSearch')
const BestOfProduct = require('../models/BestOfProduct')
const mongoose = require('mongoose')
const { logger } = require('../services/logger')

// Lazy load Gemini AI if API key is configured
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey || apiKey.trim() === '') {
    return null
  }
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai')
    return new GoogleGenerativeAI(apiKey)
  } catch (err) {
    logger.warn({ event: 'gemini_init_warning', error: err.message }, 'Gemini AI SDK unavailable')
    return null
  }
}

/**
 * Deterministic First-Party Recommendation Engine (No external API required)
 * Computes personalized scores for products based on user activity signals:
 * 1. Search History (SearchTerm)
 * 2. Purchase History (Order)
 * 3. Viewed Products (ProductView)
 * 4. Positive Reviews (Review >= 4)
 * 5. Popularity & Rating (Product.averageRating, reviewCount)
 */
const getDeterministicSuggestions = async (userId) => {
  try {
    const now = new Date()
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000)

    // Gather User Activity Signals
    const [searchTerms, orders, views, reviews] = await Promise.all([
      SearchTerm.find({ userId, createdAt: { $gte: thirtyDaysAgo } }).select('searchTerm').lean(),
      Order.find({ userId, status: { $in: ['pending', 'shipping', 'delivered'] } }).select('items.productId').lean(),
      ProductView.find({ userId, createdAt: { $gte: thirtyDaysAgo } }).select('productId').lean(),
      Review.find({ userId, rating: { $gte: 4 } }).select('productId').lean(),
    ])

    const userSearchKeywords = searchTerms.map((s) => s.searchTerm.toLowerCase().trim()).filter((s) => s.length >= 2)
    const purchasedProductIds = orders.flatMap((o) => o.items.map((i) => i.productId ? i.productId.toString() : null)).filter(Boolean)
    const viewedProductIds = views.map((v) => v.productId ? v.productId.toString() : null).filter(Boolean)
    const likedProductIds = reviews.map((r) => r.productId ? r.productId.toString() : null).filter(Boolean)

    // Resolve Category Affinities from Purchased and Viewed products
    const interactedProductIds = [...new Set([...purchasedProductIds, ...viewedProductIds, ...likedProductIds])]
    let preferredCategoryIds = []
    if (interactedProductIds.length > 0) {
      const interactedProducts = await Product.find({ _id: { $in: interactedProductIds } }).select('category').lean()
      preferredCategoryIds = interactedProducts.map((p) => p.category ? p.category.toString() : null).filter(Boolean)
    }

    // Fetch Candidate In-Stock Products
    const candidateProducts = await Product.find({ stockCount: { $gt: 0 } })
      .select('-__v -createdAt -updatedAt')
      .sort({ averageRating: -1, reviewCount: -1 })
      .limit(50)
      .lean()

    if (candidateProducts.length === 0) {
      return []
    }

    // Score Each Product
    const scoredProducts = candidateProducts.map((product) => {
      let score = 0
      let reasons = []

      // 1. Rating Score (0 to 10 points)
      const ratingScore = (product.averageRating || 0) * 2
      score += ratingScore

      // 2. Category Affinity Score (5 points)
      if (product.category && preferredCategoryIds.includes(product.category.toString())) {
        score += 5
        reasons.push('Based on items in your favorite categories')
      }

      // 3. Search Keyword Match Score (4 points)
      const titleLower = (product.title || '').toLowerCase()
      const descLower = (product.description || '').toLowerCase()
      const matchesSearch = userSearchKeywords.some((kw) => titleLower.includes(kw) || descLower.includes(kw))
      if (matchesSearch) {
        score += 4
        reasons.push('Matches your recent searches')
      }

      // 4. Popularity Bonus (Review count)
      if (product.reviewCount > 5) {
        score += 2
        reasons.push('Top-rated customer favorite')
      }

      // Default Reason for Cold Start
      if (reasons.length === 0) {
        reasons.push('Recommended popular product for you')
      }

      return {
        ...product,
        _id: product._id.toString(),
        score,
        reason: reasons[0],
      }
    })

    // Sort by Score descending and select Top 10 unique products
    scoredProducts.sort((a, b) => b.score - a.score)
    const topSuggestions = scoredProducts.slice(0, 10)

    logger.info({ event: 'deterministic_suggestions_generated', userId, count: topSuggestions.length }, 'Generated first-party deterministic recommendations')
    return topSuggestions
  } catch (error) {
    logger.error({ event: 'deterministic_suggestions_error', userId, error: error.message }, 'Error generating deterministic suggestions')
    return []
  }
}

/**
 * Cold-Start Fallback Generator
 * For new users without activity history: returns top-rated in-stock items + Best of Week products
 */
const getColdStartSuggestions = async () => {
  try {
    const popularProducts = await Product.find({ stockCount: { $gt: 0 } })
      .select('-__v -createdAt -updatedAt')
      .sort({ averageRating: -1, reviewCount: -1 })
      .limit(10)
      .lean()

    return popularProducts.map((p) => ({
      ...p,
      _id: p._id.toString(),
      reason: 'Trending popular product',
    }))
  } catch (error) {
    logger.error({ event: 'cold_start_suggestions_error', error: error.message }, 'Error in cold start recommendations')
    return []
  }
}

const getSuggestedProducts = async (userId) => {
  const genAI = getGeminiClient()

  // If Gemini API Key is configured, attempt LLM-assisted generation
  if (genAI) {
    try {
      // Execute Gemini AI generation logic
      const searchTerms = await getSearchHistory(userId)
      const purchaseHistory = await getPurchaseHistory(userId)
      const viewedProducts = await getViewedProducts(userId)
      const reviews = await getReviews(userId)

      const queries = await generateQueries(genAI, searchTerms, purchaseHistory, viewedProducts, reviews)
      if (queries && queries.length > 0) {
        const searchResults = await searchForQueries(queries)
        const finalPromptText = JSON.stringify({
          suggestedQueryResults: searchResults.suggestedQueryResults,
          userActivity: { searchTerms: searchTerms.split(', '), purchaseHistory, viewedProducts, reviews }
        })
        const finalSuggestions = await generateFinalProductSuggestions(genAI, finalPromptText)
        if (finalSuggestions && finalSuggestions.suggestedProducts) {
          const returnedProducts = await getFinalSuggestedProducts(finalSuggestions)
          if (returnedProducts.length > 0) {
            return returnedProducts
          }
        }
      }
    } catch (error) {
      logger.warn({ event: 'gemini_suggestions_failed_fallback', userId, error: error.message }, 'Gemini AI recommendation failed; falling back to deterministic engine')
    }
  }

  // Fallback to First-Party Deterministic Engine
  const deterministicResults = await getDeterministicSuggestions(userId)
  if (deterministicResults.length > 0) {
    return deterministicResults
  }

  // Cold Start Fallback
  return await getColdStartSuggestions()
}

// Helpers for Gemini integration
const getSearchHistory = async (userId) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const terms = await SearchTerm.find({ userId, createdAt: { $gte: thirtyDaysAgo } }).sort({ createdAt: -1 }).select('searchTerm').lean()
    return terms.map((t) => t.searchTerm).join(', ')
  } catch (e) { return '' }
}

const getPurchaseHistory = async (userId) => {
  try {
    const orders = await Order.find({ userId, status: { $in: ['pending', 'shipping', 'delivered'] } }).select('items.productId').lean()
    const pIds = orders.flatMap((o) => o.items.map((i) => i.productId))
    const prods = await Product.find({ _id: { $in: pIds } }).select('title').lean()
    return prods.map((p) => p.title).join(', ')
  } catch (e) { return '' }
}

const getViewedProducts = async (userId) => {
  try {
    const views = await ProductView.find({ userId }).select('productId').lean()
    const pIds = [...new Set(views.map((v) => v.productId))]
    const prods = await Product.find({ _id: { $in: pIds } }).select('title').lean()
    return prods.map((p) => p.title).join(', ')
  } catch (e) { return '' }
}

const getReviews = async (userId) => {
  try {
    const reviews = await Review.find({ userId }).populate('productId', 'title').select('rating comment productId').lean()
    return reviews.map((r) => `${r.productId?.title || 'Product'}: ${r.rating}/5`).join('\n')
  } catch (e) { return '' }
}

const generateQueries = async (genAI, searchTerms, purchaseHistory, viewedProducts, reviews) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
    const prompt = `Based on user searches: [${searchTerms}], purchases: [${purchaseHistory}], views: [${viewedProducts}], return JSON object: {"queries": [{"query": "grocery item", "reason": "why"}]}`
    const res = await model.generateContent(prompt)
    const text = (await res.response.text()).replace(/```json|```/g, '').trim()
    return JSON.parse(text).queries
  } catch (e) { return [] }
}

const generateFinalProductSuggestions = async (genAI, finalPromptText) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
    const res = await model.generateContent(finalPromptText)
    const text = (await res.response.text()).replace(/```json|```/g, '').trim()
    return JSON.parse(text)
  } catch (e) { return { suggestedProducts: [] } }
}

const searchForQueries = async (queries) => {
  const results = []
  for (const q of queries) {
    if (!q.query) continue
    const products = await Product.find({ $text: { $search: q.query }, stockCount: { $gt: 0 } }).select('_id title').limit(3).lean()
    products.forEach((p) => results.push({ _id: p._id.toString(), productName: p.title }))
  }
  return { suggestedQueryResults: results }
}

const getFinalSuggestedProducts = async (finalSuggestions) => {
  const pIds = finalSuggestions.suggestedProducts.map((p) => p._id)
  const products = await Product.find({ _id: { $in: pIds }, stockCount: { $gt: 0 } }).select('-__v -createdAt -updatedAt').lean()
  return products.map((p) => ({ ...p, _id: p._id.toString(), reason: 'AI personalized recommendation' }))
}

module.exports = {
  getSuggestedProducts,
  getDeterministicSuggestions,
  getColdStartSuggestions,
}