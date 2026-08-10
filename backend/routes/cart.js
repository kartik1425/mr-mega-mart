const express = require('express')
const router = express.Router()
const cartController = require('../controllers/cartController')
const { verifyToken } = require('../middleware/verifyToken')
const validate = require('../middleware/validate')
const {
  addItemValidator,
  addItemOnFeedValidator,
  decrementQuantityValidator,
  deleteItemParamValidator,
} = require('../validators/cartValidator')

router.get('/get-cart', verifyToken, cartController.getCart)

router.get('/get-cart-items', verifyToken, cartController.getCartProductIds)

router.post('/add-item', verifyToken, addItemValidator, validate, cartController.addItemToCart)

router.post('/add-item-on-feed', verifyToken, addItemOnFeedValidator, validate, cartController.addItemToCartOnFeed)

router.patch('/decrement-quantity', verifyToken, decrementQuantityValidator, validate, cartController.decrementQuantity)

router.delete('/delete-item/:productId', verifyToken, deleteItemParamValidator, validate, cartController.deleteItemFromCart)

module.exports = router