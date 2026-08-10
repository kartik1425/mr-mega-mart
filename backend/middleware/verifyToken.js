const jwt = require("jsonwebtoken")
const env = require("../config/env")
const User = require("../models/User")

exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Access denied. Authorization token missing or malformed.",
      code: "AUTH_TOKEN_MISSING",
    })
  }

  const token = authHeader.split(" ")[1]

  jwt.verify(token, env.JWT_SEC, (err, decoded) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Access token has expired. Please refresh token.",
          code: "TOKEN_EXPIRED",
        })
      }
      return res.status(403).json({
        success: false,
        message: "Invalid or tampered authorization token.",
        code: "INVALID_TOKEN",
      })
    }

    req.user = decoded
    next()
  })
}

exports.verifyAdmin = (req, res, next) => {
  exports.verifyToken(req, res, async () => {
    try {
      // Check if role is in JWT payload or query User model
      let role = req.user.role
      if (!role) {
        const user = await User.findById(req.user.id).select('role').lean()
        role = user ? user.role : 'customer'
      }

      if (role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: "Access denied. Administrative authorization required.",
          code: "ADMIN_ACCESS_REQUIRED",
        })
      }

      next()
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Failed to verify administrative authorization.",
        error: err.message,
      })
    }
  })
}

exports.optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next()
  }

  const token = authHeader.split(" ")[1]
  jwt.verify(token, env.JWT_SEC, (err, decoded) => {
    if (!err) {
      req.user = decoded
    }
    next()
  })
}