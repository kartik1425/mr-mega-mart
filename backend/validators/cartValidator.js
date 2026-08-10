const { body } = require('express-validator')
const { validateObjectId } = require('./commonValidator')

const addItemValidator = [
  body('productId')
    .notEmpty()
    .withMessage('productId is required.')
    .custom((val) => require('mongoose').Types.ObjectId.isValid(val))
    .withMessage('productId must be a valid ObjectId.'),
  body('quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity must be an integer greater than or equal to 1.')
    .toInt(),
]

const addItemOnFeedValidator = [
  body('productId')
    .notEmpty()
    .withMessage('productId is required.')
    .custom((val) => require('mongoose').Types.ObjectId.isValid(val))
    .withMessage('productId must be a valid ObjectId.'),
]

const decrementQuantityValidator = [
  body('productId')
    .notEmpty()
    .withMessage('productId is required.')
    .custom((val) => require('mongoose').Types.ObjectId.isValid(val))
    .withMessage('productId must be a valid ObjectId.'),
]

const deleteItemParamValidator = [
  validateObjectId('productId'),
]

module.exports = {
  addItemValidator,
  addItemOnFeedValidator,
  decrementQuantityValidator,
  deleteItemParamValidator,
}
