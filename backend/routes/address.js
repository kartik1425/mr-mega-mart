const express = require('express')
const router = express.Router()
const userAddressController = require('../controllers/userAddressController')
const { verifyToken } = require('../middleware/verifyToken')
const validate = require('../middleware/validate')
const {
  createAddressValidator,
  updateAddressValidator,
  addressIdParamValidator,
} = require('../validators/addressValidator')

router.post('/create-user-address', verifyToken, createAddressValidator, validate, userAddressController.createAddress)

router.get('/get-all-addresses', verifyToken, userAddressController.getUserAddresses)

router.get('/get-default-address', verifyToken, userAddressController.getDefaultAddress)

router.delete('/delete-address/:addressId', verifyToken, addressIdParamValidator, validate, userAddressController.deleteAddress)

router.put('/update-address/:addressId', verifyToken, updateAddressValidator, validate, userAddressController.updateAddress)

module.exports = router