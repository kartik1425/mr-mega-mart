const User = require('../models/User')
const Subscription = require('../models/Subscription')
const { logger } = require('../services/logger')

exports.getUserProfileDetails = async (req, res) => {
  try {
    const userId = req.user.id

    const user = await User.findById(userId).select(
      'userFirstName userLastName email'
    )

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    const now = new Date()
    const activeSubscription = await Subscription.findOne({
      userId,
      isActive: true,
      status: 'active',
      expiresAt: { $gt: now },
    })

    const response = {
      userFirstName: user.userFirstName,
      userLastName: user.userLastName,
      email: user.email,
      hasActiveSubscription: !!activeSubscription,
    }

    res.status(200).json({
      success: true,
      data: response,
    })
  } catch (error) {
    logger.error({ event: 'get_user_profile_error', requestId: req.id, error: error.message }, 'Error fetching user profile details')
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile details',
    })
  }
}