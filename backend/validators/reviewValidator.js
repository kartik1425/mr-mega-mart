const { body, param, query } = require('express-validator')
const { validateObjectId } = require('./commonValidator')

const createReviewValidator = [
  body('productId').notEmpty().custom((val) => require('mongoose').Types.ObjectId.isValid(val)).withMessage('Valid productId is required.'),
  body('orderId').notEmpty().custom((val) => require('mongoose').Types.ObjectId.isValid(val)).withMessage('Valid orderId is required.'),
  body('rating').notEmpty().isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer between 1 and 5.').toInt(),
  body('comment').optional().isString().trim(),
]

const productReviewParamValidator = [
  validateObjectId('productId'),
]

const reviewableProductsParamValidator = [
  validateObjectId('orderId'),
]

const deleteReviewParamValidator = [
  validateObjectId('reviewId'),
]

module.exports = {
  createReviewValidator,
  productReviewParamValidator,
  reviewableProductsParamValidator,
  deleteReviewParamValidator,
}
