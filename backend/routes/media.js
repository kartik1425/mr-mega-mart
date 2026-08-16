const express = require('express')
const router = express.Router()
const mediaController = require('../controllers/mediaController')
const { verifyAdmin } = require('../middleware/verifyToken')

router.post('/sign', verifyAdmin, mediaController.getSignParameters)
router.post('/delete', verifyAdmin, mediaController.deleteMedia)

module.exports = router
