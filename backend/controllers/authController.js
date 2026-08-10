const User = require("../models/User")
const jwt = require("jsonwebtoken")
const argon2 = require("argon2")
const Subscription = require("../models/Subscription")
const Like = require("../models/Like")
const Cart = require("../models/Cart")
const env = require("../config/env")
const { logger, metrics } = require("../services/logger")
const { createEmptyCartForUser } = require("../controllers/cartController")

// CREATE USER / REGISTER
exports.createUser = async (req, res) => {
  try {
    const { userFirstName, userLastName, email, password } = req.body

    // Input Validation & Sanitization
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      logger.warn({ event: 'auth_register_failed', requestId: req.id, reason: 'invalid_email' }, 'Registration failed: invalid email')
      return res.status(400).json({ success: false, message: "Valid email address is required.", code: "INVALID_EMAIL" })
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      logger.warn({ event: 'auth_register_failed', requestId: req.id, reason: 'weak_password' }, 'Registration failed: weak password')
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters long.", code: "INVALID_PASSWORD" })
    }
    if (!userFirstName || typeof userFirstName !== 'string' || !userLastName || typeof userLastName !== 'string') {
      logger.warn({ event: 'auth_register_failed', requestId: req.id, reason: 'invalid_name' }, 'Registration failed: invalid name')
      return res.status(400).json({ success: false, message: "First name and last name are required.", code: "INVALID_NAME" })
    }

    const sanitizedEmail = email.trim().toLowerCase()

    // Check if user already exists
    const existingUser = await User.findOne({ email: sanitizedEmail })
    if (existingUser) {
      logger.warn({ event: 'auth_register_failed', requestId: req.id, reason: 'user_exists' }, 'Registration failed: user already exists')
      return res.status(400).json({ success: false, message: "An account with this email already exists.", code: "USER_EXISTS" })
    }

    // Hash password with Argon2id
    const hashedPassword = await argon2.hash(password, {
      type: argon2.argon2id,
    })

    const newUser = new User({
      userFirstName: userFirstName.trim(),
      userLastName: userLastName.trim(),
      email: sanitizedEmail,
      password: hashedPassword,
      role: 'customer',
    })

    const savedUser = await newUser.save()

    // Create an empty cart for the user
    const cartResult = await createEmptyCartForUser(savedUser._id)
    if (!cartResult.success) {
      await User.findByIdAndDelete(savedUser._id)
      logger.error({ event: 'auth_register_failed', requestId: req.id, userId: savedUser._id, reason: 'cart_init_failed' }, 'Registration failed: cart init failed')
      return res.status(500).json({
        success: false,
        message: "Signup failed: Unable to initialize cart.",
        code: "CART_INIT_FAILED",
      })
    }

    // Sign Access Token with Expiration
    const accessToken = jwt.sign(
      {
        id: savedUser._id,
        email: savedUser.email,
        role: savedUser.role || 'customer',
        userFirstName: savedUser.userFirstName,
        userLastName: savedUser.userLastName,
        emailVerified: savedUser.emailVerified,
      },
      env.JWT_SEC,
      { expiresIn: env.JWT_EXPIRES_IN }
    )

    // Sign Refresh Token with Expiration
    const refreshToken = jwt.sign(
      { id: savedUser._id },
      env.JWT_REFRESH_SEC,
      { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
    )

    savedUser.refreshToken = refreshToken
    await savedUser.save()

    logger.info({ event: 'auth_register_success', requestId: req.id, userId: savedUser._id }, 'User registered successfully')

    const { password: userPassword, refreshToken: userRefresh, ...others } = savedUser._doc

    res.status(201).json({
      success: true,
      ...others,
      isSubscriber: false,
      accessToken,
      refreshToken,
    })
  } catch (error) {
    logger.error({ event: 'auth_register_error', requestId: req.id, error: error.message }, 'Error during user signup')
    res.status(500).json({ success: false, message: "Signup failed", error: error.message, code: "SIGNUP_FAILED" })
  }
}

// LOGIN USER
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      metrics.increment('authFailures')
      logger.warn({ event: 'auth_login_failed', requestId: req.id, reason: 'missing_credentials' }, 'Login failed: missing credentials')
      return res.status(400).json({ success: false, message: "Email and password are required.", code: "MISSING_CREDENTIALS" })
    }

    const sanitizedEmail = email.trim().toLowerCase()

    const user = await User.findOne({ email: sanitizedEmail })
    if (!user) {
      metrics.increment('authFailures')
      logger.warn({ event: 'auth_login_failed', requestId: req.id, reason: 'invalid_credentials' }, 'Login failed: user not found')
      return res.status(401).json({ success: false, message: "Wrong login details.", code: "INVALID_CREDENTIALS" })
    }

    // Verify password with Argon2
    const isPasswordValid = await argon2.verify(user.password, password)
    if (!isPasswordValid) {
      metrics.increment('authFailures')
      logger.warn({ event: 'auth_login_failed', requestId: req.id, userId: user._id, reason: 'invalid_credentials' }, 'Login failed: invalid password')
      return res.status(401).json({ success: false, message: "Wrong login details.", code: "INVALID_CREDENTIALS" })
    }

    // Check active subscription
    const activeSubscription = await Subscription.findOne({
      userId: user._id,
      isActive: true,
      status: "active",
    })
    const isSubscriber = !!activeSubscription

    // Sign Access Token
    const accessToken = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role || 'customer',
        userFirstName: user.userFirstName,
        userLastName: user.userLastName,
        emailVerified: user.emailVerified,
      },
      env.JWT_SEC,
      { expiresIn: env.JWT_EXPIRES_IN }
    )

    let refreshToken
    try {
      if (user.refreshToken) {
        jwt.verify(user.refreshToken, env.JWT_REFRESH_SEC)
        refreshToken = user.refreshToken
      } else {
        throw new Error("No refresh token stored")
      }
    } catch (error) {
      refreshToken = jwt.sign({ id: user._id }, env.JWT_REFRESH_SEC, { expiresIn: env.JWT_REFRESH_EXPIRES_IN })
      user.refreshToken = refreshToken
      await user.save()
    }

    // Fetch liked products & cart items
    const likedProducts = await Like.find({ userId: user._id }).select("productId")
    const likedProductIds = likedProducts.map((like) => like.productId.toString())

    const cart = await Cart.findOne({ ownerId: user._id }).select("items")
    const cartItemIds = cart ? cart.items.map((item) => item.productId.toString()) : []

    logger.info({ event: 'auth_login_success', requestId: req.id, userId: user._id, role: user.role }, 'User logged in successfully')

    const { password: userPassword, stripeCustomerId, refreshToken: userRefreshToken, ...others } = user._doc

    res.status(200).json({
      success: true,
      ...others,
      isSubscriber,
      accessToken,
      refreshToken,
      likedProductIds,
      cartItemIds,
    })
  } catch (error) {
    logger.error({ event: 'auth_login_error', requestId: req.id, error: error.message }, 'Error during user login')
    res.status(500).json({ success: false, message: "Login failed", error: error.message, code: "LOGIN_FAILED" })
  }
}

// REFRESH TOKEN
exports.refreshToken = async (req, res) => {
  const { token } = req.body

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ success: false, message: "Refresh token is required.", code: "REFRESH_TOKEN_REQUIRED" })
  }

  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SEC)
    const user = await User.findById(decoded.id)

    if (!user || user.refreshToken !== token) {
      metrics.increment('authFailures')
      logger.warn({ event: 'auth_refresh_failed', reason: 'invalid_token' }, 'Refresh token failed: invalid or mismatched token')
      return res.status(403).json({ success: false, message: "Invalid refresh token.", code: "INVALID_REFRESH_TOKEN" })
    }

    const newAccessToken = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role || 'customer',
        userFirstName: user.userFirstName,
        userLastName: user.userLastName,
        emailVerified: user.emailVerified,
      },
      env.JWT_SEC,
      { expiresIn: env.JWT_EXPIRES_IN }
    )

    logger.info({ event: 'auth_refresh_success', userId: user._id }, 'Access token refreshed successfully')

    res.status(200).json({
      success: true,
      accessToken: newAccessToken,
    })
  } catch (error) {
    metrics.increment('authFailures')
    logger.warn({ event: 'auth_refresh_failed', reason: 'expired_or_corrupt_token', error: error.message }, 'Refresh token expired or corrupt')
    res.status(403).json({ success: false, message: "Invalid or expired refresh token.", code: "INVALID_REFRESH_TOKEN" })
  }
}

// LOGOUT USER
exports.logoutUser = async (req, res) => {
  try {
    if (req.user && req.user.id) {
      await User.findByIdAndUpdate(req.user.id, { $unset: { refreshToken: 1 } })
      logger.info({ event: 'auth_logout_success', userId: req.user.id }, 'User logged out successfully')
    }
    res.status(200).json({ success: true, message: 'Logged out successfully' })
  } catch (error) {
    logger.error({ event: 'auth_logout_error', error: error.message }, 'Error during logout')
    res.status(500).json({ success: false, message: 'Logout failed', error: error.message })
  }
}

// CHECK TOKENS
exports.checkTokens = async (req, res) => {
  try {
    const { token } = req.body
    if (!token) {
      return res.status(400).json({ success: false, message: 'Token is required' })
    }
    const decoded = jwt.verify(token, env.JWT_SEC)
    res.status(200).json({ success: true, valid: true, decoded })
  } catch (error) {
    res.status(401).json({ success: false, valid: false, message: 'Invalid or expired token' })
  }
}