const express = require('express')
const router = express.Router()
const { likeProduct, removeLike, getLikedProductIds } = require('../controllers/likeController')
const { verifyToken } = require('../middleware/verifyToken')
const validate = require('../middleware/validate')
const { likeProductValidator, unlikeProductParamValidator } = require('../validators/likeValidator')

router.post('/like', verifyToken, likeProductValidator, validate, likeProduct)

router.delete('/unlike/:productId', verifyToken, unlikeProductParamValidator, validate, removeLike)

router.get('/get-liked-products', verifyToken, getLikedProductIds)

module.exports = router