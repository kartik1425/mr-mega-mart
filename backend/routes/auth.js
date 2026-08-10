const router = require("express").Router()
const authController = require("../controllers/authController")
const authLimiter = require("../middleware/authLimiter")
const validate = require("../middleware/validate")
const { optionalAuth } = require("../middleware/verifyToken")
const {
  registerValidator,
  loginValidator,
  refreshTokenValidator,
  checkTokensValidator,
} = require("../validators/authValidator")

router.post("/register", authLimiter, registerValidator, validate, authController.createUser)

router.post("/login", authLimiter, loginValidator, validate, authController.loginUser)

router.post("/refresh", refreshTokenValidator, validate, authController.refreshToken)

router.post("/logout", optionalAuth, authController.logoutUser)

router.post("/check-tokens", checkTokensValidator, validate, authController.checkTokens)

module.exports = router