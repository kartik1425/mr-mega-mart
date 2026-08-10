const express = require('express')
const router = express.Router()
const reviewController = require('../controllers/reviewController')
const { verifyToken } = require('../middleware/verifyToken')
const validate = require('../middleware/validate')
const {
  createReviewValidator,
  productReviewParamValidator,
  reviewableProductsParamValidator,
  deleteReviewParamValidator,
} = require('../validators/reviewValidator')

router.get('/get-product-reviews/:productId', productReviewParamValidator, validate, reviewController.getProductReviews)

router.get('/get-reviewable-products/:orderId', verifyToken, reviewableProductsParamValidator, validate, reviewController.getReviewableProducts)

router.post('/create-review', verifyToken, createReviewValidator, validate, reviewController.createReview)

router.delete('/delete-review/:reviewId', verifyToken, deleteReviewParamValidator, validate, reviewController.deleteComment)

module.exports = router