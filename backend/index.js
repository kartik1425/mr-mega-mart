const env = require('./config/env')
const express = require('express')
const app = express()
app.set('trust proxy', 1)
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const cors = require('cors')
const mongoSanitize = require('express-mongo-sanitize')
const hpp = require('hpp')

const { logger } = require('./services/logger')
const { createRedisClient, getRedisClient } = require('./services/redisClient')
const paymentService = require('./services/payment')
const requestCorrelation = require('./middleware/requestCorrelation')
const requestLogger = require('./middleware/requestLogger')
const errorHandler = require('./middleware/errorHandler')
const cronJobs = require('./cronJobs')

const healthRoute = require('./routes/health')
const authRoute = require('./routes/auth')
const dealsRoute = require('./routes/deals')
const categoryRoute = require('./routes/categories')
const productsRoute = require('./routes/products')
const cartRoute = require('./routes/cart')
const paymentRoute = require('./routes/payments')
const addressRoute = require('./routes/address')
const ordersRoute = require('./routes/orders')
const subscriptionsRoute = require('./routes/subscriptions')
const trialProductsRoute = require('./routes/trialProducts')
const trialsRoute = require('./routes/trials')
const reviewsRoute = require('./routes/reviews')
const aiSuggestionsRoute = require('./routes/aiSuggestions')
const likesRoute = require('./routes/likes')
const trendingSearchesRoute = require('./routes/searchTrends')
const userProfilesRoute = require('./routes/userProfiles')
const adminRoute = require('./routes/admin')

// Global Request Correlation & Structured Logging Middlewares
app.use(requestCorrelation)
app.use(requestLogger)

// Connect to MongoDB & Lifecycle Events
async function initDatabase() {
  const timeoutMs = env.NODE_ENV === 'production' ? 15000 : 5000
  const maxRetries = env.NODE_ENV === 'production' ? 5 : 1

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: timeoutMs, family: 4 })
      logger.info({ event: 'mongodb_connected', attempt }, '[MongoDB] Connected successfully to primary database')
      return
    } catch (err) {
      logger.warn({ event: 'mongodb_primary_failed', attempt, error: err.message }, `[MongoDB] Primary connection attempt ${attempt}/${maxRetries} failed (${err.message}).`)
      if (attempt < maxRetries) {
        await new Promise(res => setTimeout(res, 3000))
      }
    }
  }

  logger.error({ event: 'mongodb_connection_failed' }, '[MongoDB] Connection to MongoDB Atlas failed after retries.')
}

initDatabase()

mongoose.connection.on('disconnected', () => {
  logger.warn({ event: 'mongodb_disconnected' }, '[MongoDB] Connection lost')
})

if (env.USE_REDIS) {
  createRedisClient()
}

// Security Middlewares
app.set('trust proxy', 1)

// 1. Helmet HTTP Security Headers
app.use(helmet())

// 2. CORS Configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser clients (mobile app, curl, postman)
    if (!origin) return callback(null, true)
    
    if (env.NODE_ENV !== 'production') return callback(null, true)
    
    const allowed = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
      : ['https://mrmegamart-admin.vercel.app', 'http://localhost:3000', 'http://127.0.0.1:3000']
      
    if (allowed.includes('*') || allowed.includes(origin) || origin.endsWith('.vercel.app') || origin.includes('localhost')) {
      return callback(null, true)
    }
    return callback(new Error('CORS access denied: origin not allowed.'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}
app.use(cors(corsOptions))

// 3. NoSQL Injection Prevention
app.use(mongoSanitize())

// 4. HTTP Parameter Pollution Prevention
app.use(hpp())

// Rate Limiters
const globalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_GLOBAL_WINDOW_MS,
  max: env.RATE_LIMIT_GLOBAL_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
})

const paymentLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_GLOBAL_WINDOW_MS,
  max: env.RATE_LIMIT_PAYMENT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many payment attempts. Please try again later.',
    code: 'PAYMENT_RATE_LIMIT_EXCEEDED',
  },
})

app.use(globalLimiter)

// Webhook raw body parser MUST be mounted before standard JSON parser
app.use('/api/payments', paymentLimiter, paymentRoute)

app.use(bodyParser.json({ limit: '10mb' }))
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }))

// Mount Application Routes
app.use('/api', healthRoute)
app.use('/api', authRoute)
app.use('/api/deals', dealsRoute)
app.use('/api/categories', categoryRoute)
app.use('/api/products', productsRoute)
app.use('/api/carts', cartRoute)
app.use('/api/address', addressRoute)
app.use('/api/orders', ordersRoute)
app.use('/api/subscriptions', subscriptionsRoute)
app.use('/api/trialProducts', trialProductsRoute)
app.use('/api/trials', trialsRoute)
app.use('/api/reviews', reviewsRoute)
app.use('/api/aiSuggestions', aiSuggestionsRoute)
app.use('/api/likes', likesRoute)
app.use('/api/trendingSearches', trendingSearchesRoute)
app.use('/api/userProfiles', userProfilesRoute)
app.use('/api/admin', adminRoute)

// Centralized Error Handling Middleware
app.use(errorHandler)

const server = app.listen(env.PORT, () => {
  logger.info({
    event: 'application_startup',
    port: env.PORT,
    environment: env.NODE_ENV,
    redisEnabled: env.USE_REDIS,
    paymentProvider: paymentService.getProviderName(),
  }, `[MR Mega Mart] Server running on port ${env.PORT} in ${env.NODE_ENV} mode`)
})

// Graceful Shutdown & Unhandled Exception Handling
const gracefulShutdown = (signal) => {
  logger.info({ event: 'application_shutdown', signal }, `[MR Mega Mart] Received ${signal}. Starting graceful shutdown...`)
  server.close(async () => {
    logger.info({ event: 'http_server_closed' }, '[MR Mega Mart] HTTP server closed.')
    try {
      await mongoose.connection.close()
      logger.info({ event: 'mongodb_connection_closed' }, '[MR Mega Mart] MongoDB connection closed.')
      const redis = getRedisClient()
      if (redis) {
        await redis.quit()
        logger.info({ event: 'redis_connection_closed' }, '[MR Mega Mart] Redis connection closed.')
      }
      process.exit(0)
    } catch (err) {
      logger.error({ event: 'shutdown_error', error: err.message }, '[MR Mega Mart] Error during shutdown.')
      process.exit(1)
    }
  })
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'))
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))

process.on('uncaughtException', (err) => {
  logger.fatal({ event: 'uncaught_exception', error: err.message, stack: err.stack }, `Uncaught Exception: ${err.message}`)
  gracefulShutdown('uncaughtException')
})

process.on('unhandledRejection', (reason, promise) => {
  logger.error({ event: 'unhandled_rejection', reason: reason?.message || reason }, `Unhandled Rejection: ${reason?.message || reason}`)
})