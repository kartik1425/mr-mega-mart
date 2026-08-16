require('dotenv').config()

const NODE_ENV = process.env.NODE_ENV || 'development'
const PORT = parseInt(process.env.PORT || '5001', 10)
const MONGODB_URI = (process.env.MONGODB_URI && process.env.MONGODB_URI.includes('bK6wV9lU5QpSGT6J'))
  ? process.env.MONGODB_URI
  : 'mongodb+srv://mrmegamartadmin:bK6wV9lU5QpSGT6J@mr-mega-mart.3na3skh.mongodb.net/mrmegamart?retryWrites=true&w=majority'

// Logging & Observability Configuration
const LOG_LEVEL = process.env.LOG_LEVEL || 'info'
const SLOW_REQUEST_THRESHOLD_MS = parseInt(process.env.SLOW_REQUEST_THRESHOLD_MS || '1000', 10)

// JWT Configuration
const JWT_SEC = process.env.JWT_SEC || 'default_jwt_secret_change_in_production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h'
const JWT_REFRESH_SEC = process.env.JWT_REFRESH_SEC || 'default_jwt_refresh_secret_change_in_production'
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d'

// Redis Configuration
const USE_REDIS = process.env.USE_REDIS === 'true'
const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1'
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10)
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || process.env.REDISPASSWORD || null
const REDIS_URL = process.env.REDIS_PUBLIC_URL || process.env.REDIS_URL || null

// Cache TTL Configuration (in seconds)
const CACHE_CATEGORIES_TTL = parseInt(process.env.CACHE_CATEGORIES_TTL || '1800', 10) // 30 minutes
const CACHE_DEALS_TTL = parseInt(process.env.CACHE_DEALS_TTL || '600', 10)            // 10 minutes
const CACHE_PRODUCTS_TTL = parseInt(process.env.CACHE_PRODUCTS_TTL || '600', 10)        // 10 minutes
const CACHE_SEARCH_TTL = parseInt(process.env.CACHE_SEARCH_TTL || '180', 10)            // 3 minutes
const CACHE_TRENDING_TTL = parseInt(process.env.CACHE_TRENDING_TTL || '600', 10)        // 10 minutes

// Payment Configuration (Stripe)
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || ''
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || ''
const STRIPE_MONTHLY_SUBSCRIPTION_PRICE_ID = process.env.STRIPE_MONTHLY_SUBSCRIPTION_PRICE_ID || process.env.STRIPE_MONTHYLY_SUBSCRIPTION_PRICE_ID || ''

// AI Configuration (Gemini)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''

// Cron Schedules
const CRON_SEARCH_TRENDS_SCHEDULE = process.env.CRON_SEARCH_TRENDS_SCHEDULE || '0 0 * * *'
const CRON_BEST_OF_WEEK_SCHEDULE = process.env.CRON_BEST_OF_WEEK_SCHEDULE || '0 0 * * *'
const CRON_BEST_OF_MONTH_SCHEDULE = process.env.CRON_BEST_OF_MONTH_SCHEDULE || '0 0 * * *'

// Rate Limiting
const RATE_LIMIT_GLOBAL_WINDOW_MS = parseInt(process.env.RATE_LIMIT_GLOBAL_WINDOW_MS || '60000', 10)
const RATE_LIMIT_GLOBAL_MAX = parseInt(process.env.RATE_LIMIT_GLOBAL_MAX || '100', 10)
const RATE_LIMIT_PAYMENT_MAX = parseInt(process.env.RATE_LIMIT_PAYMENT_MAX || '10', 10)

// Cloudinary Media Configuration
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || ''
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || ''
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || ''

module.exports = {
  NODE_ENV,
  PORT,
  MONGODB_URI,
  LOG_LEVEL,
  SLOW_REQUEST_THRESHOLD_MS,
  JWT_SEC,
  JWT_EXPIRES_IN,
  JWT_REFRESH_SEC,
  JWT_REFRESH_EXPIRES_IN,
  USE_REDIS,
  REDIS_HOST,
  REDIS_PORT,
  REDIS_PASSWORD,
  REDIS_URL,
  CACHE_CATEGORIES_TTL,
  CACHE_DEALS_TTL,
  CACHE_PRODUCTS_TTL,
  CACHE_SEARCH_TTL,
  CACHE_TRENDING_TTL,
  STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET,
  STRIPE_MONTHLY_SUBSCRIPTION_PRICE_ID,
  GEMINI_API_KEY,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CRON_SEARCH_TRENDS_SCHEDULE,
  CRON_BEST_OF_WEEK_SCHEDULE,
  CRON_BEST_OF_MONTH_SCHEDULE,
  RATE_LIMIT_GLOBAL_WINDOW_MS,
  RATE_LIMIT_GLOBAL_MAX,
  RATE_LIMIT_PAYMENT_MAX,
}