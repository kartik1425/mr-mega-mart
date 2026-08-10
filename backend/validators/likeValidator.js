const { body } = require('express-validator')
const { validateObjectId } = require('./commonValidator')

const likeProductValidator = [
  body('productId').notEmpty().custom((val) => require('mongoose').Types.ObjectId.isValid(val)).withMessage('Valid productId is required.'),
]

const unlikeProductParamValidator = [
  validateObjectId('productId'),
]

module.exports = {
  likeProductValidator,
  unlikeProductParamValidator,
}
