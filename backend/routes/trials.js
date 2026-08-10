const express = require('express')
const router = express.Router()
const { verifyToken } = require('../middleware/verifyToken')
const trialController = require('../controllers/trialController')
const validate = require('../middleware/validate')
const { createTrialValidator } = require('../validators/trialValidator')

router.post('/create-trial', verifyToken, createTrialValidator, validate, trialController.createTrial)

router.get('/active-trial-details', verifyToken, trialController.getTrialDetails)

module.exports = router