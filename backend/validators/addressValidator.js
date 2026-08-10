const { body } = require('express-validator')
const { validateObjectId } = require('./commonValidator')

const createAddressValidator = [
  body('addressTitle').notEmpty().withMessage('Address title is required.').isString().trim(),
  body('contactName').notEmpty().withMessage('Contact name is required.').isString().trim(),
  body('phone').notEmpty().withMessage('Phone number is required.').isString().trim(),
  body('city').notEmpty().withMessage('City is required.').isString().trim(),
  body('district').notEmpty().withMessage('District is required.').isString().trim(),
  body('fullAddress').notEmpty().withMessage('Full address is required.').isString().trim(),
  body('isDefault').optional().isBoolean().withMessage('isDefault must be a boolean.'),
]

const updateAddressValidator = [
  validateObjectId('addressId'),
  body('addressTitle').optional().isString().trim(),
  body('contactName').optional().isString().trim(),
  body('phone').optional().isString().trim(),
  body('city').optional().isString().trim(),
  body('district').optional().isString().trim(),
  body('fullAddress').optional().isString().trim(),
  body('isDefault').optional().isBoolean().withMessage('isDefault must be a boolean.'),
]

const addressIdParamValidator = [
  validateObjectId('addressId'),
]

module.exports = {
  createAddressValidator,
  updateAddressValidator,
  addressIdParamValidator,
}
