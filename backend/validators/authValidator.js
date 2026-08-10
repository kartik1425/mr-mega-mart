const { body } = require('express-validator')

const registerValidator = [
  body('userFirstName')
    .notEmpty()
    .withMessage('First name is required.')
    .isString()
    .trim(),
  body('userLastName')
    .notEmpty()
    .withMessage('Last name is required.')
    .isString()
    .trim(),
  body('email')
    .notEmpty()
    .withMessage('Email address is required.')
    .isEmail()
    .withMessage('Must be a valid email address.')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required.')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long.'),
]

const loginValidator = [
  body('email')
    .notEmpty()
    .withMessage('Email address is required.')
    .isEmail()
    .withMessage('Must be a valid email address.')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required.'),
]

const refreshTokenValidator = [
  body('token')
    .notEmpty()
    .withMessage('Refresh token is required.')
    .isString(),
]

const checkTokensValidator = [
  body('accessToken')
    .notEmpty()
    .withMessage('Access token is required.')
    .isString(),
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required.')
    .isString(),
]

module.exports = {
  registerValidator,
  loginValidator,
  refreshTokenValidator,
  checkTokensValidator,
}
