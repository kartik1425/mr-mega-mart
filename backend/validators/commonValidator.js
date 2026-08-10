const { param, query } = require('express-validator')
const mongoose = require('mongoose')

const validateObjectId = (paramName) =>
  param(paramName)
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage(`Invalid ${paramName} ObjectId format.`)

const paginationValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer.')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100.')
    .toInt(),
  query('search')
    .optional()
    .isString()
    .trim()
    .escape(),
]

module.exports = {
  validateObjectId,
  paginationValidator,
}
