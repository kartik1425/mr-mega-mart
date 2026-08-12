const { body } = require('express-validator')
const { validateObjectId } = require('./commonValidator')

const createAddressValidator = [
  body('fullName')
    .optional()
    .isString()
    .trim(),
  body('phoneNumber')
    .optional()
    .isString()
    .trim(),
  body('address')
    .optional()
    .isString()
    .trim(),
  body('city')
    .notEmpty()
    .withMessage('City is required.')
    .isString()
    .trim(),
  body('state')
    .optional()
    .isString()
    .trim(),
  body('postalCode')
    .optional()
    .isString()
    .trim(),
  body('country')
    .optional()
    .isString()
    .trim(),
  body('addressType')
    .optional()
    .isIn(['home', 'work', 'other'])
    .withMessage('addressType must be home, work, or other'),
  body('isDefault')
    .optional()
    .isBoolean()
    .withMessage('isDefault must be a boolean.'),
]

const updateAddressValidator = [
  validateObjectId('addressId'),
  body('fullName').optional().isString().trim(),
  body('phoneNumber').optional().isString().trim(),
  body('address').optional().isString().trim(),
  body('city').optional().isString().trim(),
  body('state').optional().isString().trim(),
  body('postalCode').optional().isString().trim(),
  body('country').optional().isString().trim(),
  body('addressType').optional().isIn(['home', 'work', 'other']),
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
