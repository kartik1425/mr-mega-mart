const express = require('express')
const router = express.Router()
const settingsController = require('../controllers/settingsController')
const { verifyToken } = require('../middleware/verifyToken')

router.get('/get-settings', settingsController.getStoreSettings)
router.put('/update-settings', verifyToken, settingsController.updateStoreSettings)

module.exports = router
