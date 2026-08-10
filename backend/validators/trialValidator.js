const { body, query } = require('express-validator')

const createTrialValidator = [
  body('trialProductId')
    .notEmpty()
    .custom((val) => require('mongoose').Types.ObjectId.isValid(val))
    .withMessage('Valid trialProductId is required.'),
  body('trialPeriod')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Trial period must be a positive integer.')
    .toInt(),
]

const checkOrderStatusValidator = [
  query('paymentIntentId')
    .notEmpty()
    .withMessage('paymentIntentId query parameter is required.')
    .isString()
    .trim(),
]

module.exports = {
  createTrialValidator,
  checkOrderStatusValidator,
}
