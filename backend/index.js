const env = require('./config/env')
const express = require('express')
const app = express()
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

// Connect to MongoDB & Lifecycle Events with Resilient MongoMemoryServer Fallback
async function initDatabase() {
  const timeoutMs = env.NODE_ENV === 'production' ? 15000 : 5000
  try {
    await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: timeoutMs })
    logger.info({ event: 'mongodb_connected' }, '[MongoDB] Connected successfully to primary database')
  } catch (err) {
    logger.warn({ event: 'mongodb_primary_failed', error: err.message }, `[MongoDB] Primary connection failed (${err.message}).`)
    if (env.NODE_ENV === 'production') {
      logger.error({ event: 'mongodb_prod_connection_failed' }, '[MongoDB] Production connection to MongoDB Atlas failed. Check MONGODB_URI and Atlas IP Access List (0.0.0.0/0).')
      return
    }
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server')
      const mongoServer = await MongoMemoryServer.create({
        binary: {
          downloadDir: require('path').join(__dirname, '.mongo-bin'),
        },
        instance: {
          dbName: 'mrmegamart'
        }
      })
      const mongoUri = mongoServer.getUri()
      await mongoose.connect(mongoUri)
      logger.info({ event: 'mongodb_memory_server_connected', uri: mongoUri }, '[MongoDB] Connected to MongoMemoryServer fallback successfully')

      // Automatically seed test products into memory DB if empty
      const Category = require('./models/Category')
      const Product = require('./models/Product')
      const categoryCount = await Category.countDocuments()
      if (categoryCount === 0) {
        logger.info({ event: 'auto_seeding_started' }, '[MongoDB] Auto-seeding 25 staging products into MongoMemoryServer...')
        const groceryCat = await new Category({ name: 'Groceries', description: 'Daily essentials and fresh food' }).save()
        const dairyCat = await new Category({ name: 'Dairy & Eggs', description: 'Fresh milk, butter, cheese, and eggs', parentCategory: groceryCat._id }).save()
        const beverageCat = await new Category({ name: 'Beverages', description: 'Tea, coffee, juices, and soft drinks', parentCategory: groceryCat._id }).save()
        const snacksCat = await new Category({ name: 'Snacks & Munchies', description: 'Biscuits, chips, and traditional snacks', parentCategory: groceryCat._id }).save()
        const personalCat = await new Category({ name: 'Personal Care', description: 'Soaps, shampoos, and hygiene products' }).save()
        const householdCat = await new Category({ name: 'Household Essentials', description: 'Detergents, cleaners, and repellents' }).save()

        const productList = [
          { title: 'Aashirvaad Shudh Chakki Atta 5 kg', description: '100% pure whole wheat flour milled from high quality grains for soft rotis.', price: 245, oldPrice: 280, salePrice: 245, stockCount: 50, category: groceryCat._id, tags: ['atta', 'flour', 'grocery'], cargoWeight: 5.0, imageURLs: ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop'], averageRating: 4.8, reviewCount: 42, likeCount: 15 },
          { title: 'India Gate Basmati Rice Feast Rozzana 5 kg', description: 'Premium medium-grain aromatic basmati rice ideal for everyday cooking.', price: 399, oldPrice: 460, salePrice: 399, stockCount: 40, category: groceryCat._id, tags: ['rice', 'basmati', 'grocery'], cargoWeight: 5.0, imageURLs: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop'], averageRating: 4.6, reviewCount: 28, likeCount: 9 },
          { title: 'Tata Salt Vacuum Evaporated Iodised Salt 1 kg', description: 'Purity guaranteed iodised salt essential for daily dietary wellness.', price: 28, oldPrice: 30, salePrice: 28, stockCount: 100, category: groceryCat._id, tags: ['salt', 'tata', 'grocery'], cargoWeight: 1.0, imageURLs: ['https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop'], averageRating: 4.9, reviewCount: 88, likeCount: 30 },
          { title: 'Fortune Sunlite Refined Sunflower Oil 1 L', description: 'Light and healthy refined sunflower oil rich in Vitamin E.', price: 135, oldPrice: 160, salePrice: 135, stockCount: 65, category: groceryCat._id, tags: ['oil', 'cooking oil', 'grocery'], cargoWeight: 1.0, imageURLs: ['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop'], averageRating: 4.5, reviewCount: 19, likeCount: 6 },
          { title: 'Tata Sampann Unpolished Toor Dal 1 kg', description: 'High protein unpolished arhar/toor dal sourced directly from Indian farms.', price: 165, oldPrice: 190, salePrice: 165, stockCount: 45, category: groceryCat._id, tags: ['dal', 'pulses', 'grocery'], cargoWeight: 1.0, imageURLs: ['https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop'], averageRating: 4.7, reviewCount: 34, likeCount: 11 },
          { title: 'Amul Taaza Homogenised Toned Milk 1 L', description: 'Fresh and nutritious homogenized toned long-life UHT milk pack.', price: 72, oldPrice: 75, salePrice: 72, stockCount: 80, category: dairyCat._id, tags: ['milk', 'amul', 'dairy'], cargoWeight: 1.0, imageURLs: ['https://images.unsplash.com/photo-1563636619-e9143da7973b?w=600&auto=format&fit=crop'], averageRating: 4.9, reviewCount: 110, likeCount: 45 },
          { title: 'Amul Pasteurised Salted Butter 500 g', description: 'Rich, creamy salted butter made from pure cow milk fat.', price: 275, oldPrice: 290, salePrice: 275, stockCount: 30, category: dairyCat._id, tags: ['butter', 'amul', 'dairy'], cargoWeight: 0.5, imageURLs: ['https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&auto=format&fit=crop'], averageRating: 4.9, reviewCount: 65, likeCount: 22 },
          { title: 'Amul Processed Cheese Slices 200 g', description: 'Individually wrapped creamy cheese slices perfect for sandwiches.', price: 140, oldPrice: 155, salePrice: 140, stockCount: 35, category: dairyCat._id, tags: ['cheese', 'amul', 'dairy'], cargoWeight: 0.2, imageURLs: ['https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=600&auto=format&fit=crop'], averageRating: 4.7, reviewCount: 29, likeCount: 14 },
          { title: 'Mother Dairy Fresh Masti Dahi 400 g', description: 'Thick, creamy, and natural curd packed with beneficial probiotics.', price: 35, oldPrice: 40, salePrice: 35, stockCount: 50, category: dairyCat._id, tags: ['curd', 'dahi', 'dairy'], cargoWeight: 0.4, imageURLs: ['https://images.unsplash.com/photo-1571212515416-fef01fc43637?w=600&auto=format&fit=crop'], averageRating: 4.6, reviewCount: 18, likeCount: 8 },
          { title: 'Tata Tea Premium Desh Ki Chai 250 g', description: 'Unique blend of big tea leaves for aroma and small tea leaves for strength.', price: 150, oldPrice: 170, salePrice: 150, stockCount: 60, category: beverageCat._id, tags: ['tea', 'chai', 'beverages'], cargoWeight: 0.25, imageURLs: ['https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop'], averageRating: 4.8, reviewCount: 52, likeCount: 19 },
          { title: 'Nescafé Classic Instant Coffee Powder 100 g', description: '100% pure natural instant coffee crafted from selected Robusta beans.', price: 320, oldPrice: 360, salePrice: 320, stockCount: 40, category: beverageCat._id, tags: ['coffee', 'nescafe', 'beverages'], cargoWeight: 0.1, imageURLs: ['https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop'], averageRating: 4.8, reviewCount: 75, likeCount: 28 },
          { title: 'Real Fruit Power Mixed Fruit Juice 1 L', description: 'Refreshing fruit juice beverage packed with goodness of 9 fruits.', price: 110, oldPrice: 130, salePrice: 110, stockCount: 45, category: beverageCat._id, tags: ['juice', 'beverages'], cargoWeight: 1.0, imageURLs: ['https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=600&auto=format&fit=crop'], averageRating: 4.4, reviewCount: 21, likeCount: 7 },
          { title: 'Parle-G Original Glucose Biscuits 800 g', description: 'India\'s favorite energy biscuits rich in wheat and milk goodness.', price: 80, oldPrice: 90, salePrice: 80, stockCount: 120, category: snacksCat._id, tags: ['biscuits', 'parle-g', 'snacks'], cargoWeight: 0.8, imageURLs: ['https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&auto=format&fit=crop'], averageRating: 4.9, reviewCount: 140, likeCount: 50 },
          { title: 'Britannia Good Day Butter Cookies 600 g', description: 'Crispy butter cookies packed with rich butter flavor and crunch.', price: 120, oldPrice: 140, salePrice: 120, stockCount: 70, category: snacksCat._id, tags: ['cookies', 'britannia', 'snacks'], cargoWeight: 0.6, imageURLs: ['https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600&auto=format&fit=crop'], averageRating: 4.7, reviewCount: 48, likeCount: 18 },
          { title: 'Haldiram\'s Nagpur Aloo Bhujia 400 g', description: 'Crispy, spicy potato & chickpea flour noodle snack seasoned with Indian spices.', price: 115, oldPrice: 130, salePrice: 115, stockCount: 55, category: snacksCat._id, tags: ['namkeen', 'bhujia', 'snacks'], cargoWeight: 0.4, imageURLs: ['https://images.unsplash.com/photo-1621996346565-e3d5d6281236?w=600&auto=format&fit=crop'], averageRating: 4.8, reviewCount: 62, likeCount: 25 },
          { title: 'Lay\'s India\'s Magic Masala Potato Chips 115 g', description: 'Crunchy ridged potato chips seasoned with aromatic Indian spices.', price: 50, oldPrice: 50, salePrice: 50, stockCount: 90, category: snacksCat._id, tags: ['lays', 'chips', 'snacks'], cargoWeight: 0.115, imageURLs: ['https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&auto=format&fit=crop'], averageRating: 4.6, reviewCount: 95, likeCount: 33 },
          { title: 'Dove Cream Beauty Bathing Soap Bar 125 g (Pack of 3)', description: 'Moisturizing beauty bar with 1/4th moisturizing cream for soft skin.', price: 195, oldPrice: 225, salePrice: 195, stockCount: 40, category: personalCat._id, tags: ['soap', 'dove', 'personal care'], cargoWeight: 0.375, imageURLs: ['https://images.unsplash.com/photo-1607006482602-76ca78f237f3?w=600&auto=format&fit=crop'], averageRating: 4.8, reviewCount: 55, likeCount: 21 },
          { title: 'Colgate Strong Teeth Toothpaste 500 g Combo', description: 'Calcium and Minerals boosted toothpaste for strong, healthy teeth.', price: 210, oldPrice: 240, salePrice: 210, stockCount: 60, category: personalCat._id, tags: ['toothpaste', 'colgate', 'personal care'], cargoWeight: 0.5, imageURLs: ['https://images.unsplash.com/photo-1559598467-f8b76c8155d0?w=600&auto=format&fit=crop'], averageRating: 4.7, reviewCount: 43, likeCount: 16 },
          { title: 'Clinic Plus Strong & Long Health Shampoo 650 ml', description: 'Nourishing milk protein shampoo for 3x stronger, longer hair.', price: 360, oldPrice: 420, salePrice: 360, stockCount: 35, category: personalCat._id, tags: ['shampoo', 'personal care'], cargoWeight: 0.65, imageURLs: ['https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600&auto=format&fit=crop'], averageRating: 4.6, reviewCount: 38, likeCount: 12 },
          { title: 'Surf Excel Easy Wash Detergent Powder 1 kg', description: 'Superfast stain removal detergent powder gentle on clothes.', price: 145, oldPrice: 160, salePrice: 145, stockCount: 50, category: householdCat._id, tags: ['detergent', 'surf excel', 'household'], cargoWeight: 1.0, imageURLs: ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop'], averageRating: 4.8, reviewCount: 70, likeCount: 26 },
          { title: 'Vim Dishwash Gel Lemon 750 ml Refill Pack', description: 'Powerful degreasing dishwash liquid gel with 100 lemon power.', price: 180, oldPrice: 205, salePrice: 180, stockCount: 45, category: householdCat._id, tags: ['vim', 'cleaner', 'household'], cargoWeight: 0.75, imageURLs: ['https://images.unsplash.com/photo-1585421514738-01798e348b17?w=600&auto=format&fit=crop'], averageRating: 4.7, reviewCount: 33, likeCount: 10 },
          { title: 'Harpic Power Plus Disinfectant Toilet Cleaner 1 L', description: '10x better stain removal liquid cleaner killing 99.9% of germs.', price: 199, oldPrice: 220, salePrice: 199, stockCount: 50, category: householdCat._id, tags: ['harpic', 'cleaner', 'household'], cargoWeight: 1.0, imageURLs: ['https://images.unsplash.com/photo-1563453392212-326f5e854473?w=600&auto=format&fit=crop'], averageRating: 4.9, reviewCount: 82, likeCount: 29 },
          { title: 'Good Knight Gold Flash Mosquito Repellent Refill (Pack of 2)', description: 'Advanced dual mode mosquito liquid vaporiser refill.', price: 155, oldPrice: 175, salePrice: 155, stockCount: 40, category: householdCat._id, tags: ['mosquito', 'good knight', 'household'], cargoWeight: 0.2, imageURLs: ['https://images.unsplash.com/photo-1628102491629-778571d893a3?w=600&auto=format&fit=crop'], averageRating: 4.6, reviewCount: 25, likeCount: 9 },
        ]
        await Product.insertMany(productList)
        logger.info({ event: 'auto_seeding_completed', count: productList.length }, `[MongoDB] Successfully seeded ${productList.length} staging products!`)
      }
    } catch (memErr) {
      logger.error({ event: 'mongodb_memory_server_failed', error: memErr.message }, `[MongoDB] MemoryServer launch failed: ${memErr.message}`)
    }
  }
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
    return callback(null, true)
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