const paymentService = require('../services/payment')
const User = require('../models/User')
const Subscription = require('../models/Subscription')
const { logger } = require('../services/logger')

exports.createSubscription = async (req, res) => {
  try {
    if (!paymentService.isConfigured()) {
      return paymentService.sendNotConfiguredResponse(res)
    }

    const userId = req.user.id
    const { paymentMethodId } = req.body
    if (!paymentMethodId) {
      return res.status(400).json({ success: false, message: 'paymentMethodId is required.' })
    }

    // 1. Prevent duplicate active subscriptions
    const now = new Date()
    const existingActiveSub = await Subscription.findOne({
      userId,
      isActive: true,
      status: 'active',
      expiresAt: { $gt: now },
    })

    if (existingActiveSub) {
      logger.warn({ event: 'duplicate_subscription_prevented', userId, existingSubId: existingActiveSub._id }, 'Subscription creation rejected: Active subscription exists')
      return res.status(400).json({
        success: false,
        message: 'User already has an active subscription.',
        subscription: existingActiveSub,
      })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' })
    }

    if (!user.stripeCustomerId) {
      const customer = await paymentService.createCustomer({
        email: user.email,
        name: user.userFirstName + ' ' + user.userLastName,
      })
      user.stripeCustomerId = customer.id
      await user.save()
    }

    await paymentService.attachPaymentMethod(paymentMethodId, user.stripeCustomerId)
    await paymentService.updateCustomerDefaultPaymentMethod(user.stripeCustomerId, paymentMethodId)

    const subscription = await paymentService.createSubscription({
      customerId: user.stripeCustomerId,
      priceId: process.env.STRIPE_MONTHYLY_SUBSCRIPTION_PRICE_ID,
      paymentMethodId,
    })

    const latestInvoice = subscription.latest_invoice
    let clientSecret = null
    if (latestInvoice && latestInvoice.payment_intent) {
      clientSecret = latestInvoice.payment_intent.client_secret
    }

    const newSubscription = new Subscription({
      userId: user._id,
      stripeSubscriptionId: subscription.id,
      status: subscription.status,
      isActive: subscription.status === 'active',
      startedAt: subscription.start_date ? new Date(subscription.start_date * 1000) : null,
      expiresAt: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    })

    await newSubscription.save()

    logger.info({ event: 'subscription_created', userId, subscriptionId: newSubscription._id, status: newSubscription.status }, 'Subscription created successfully')

    res.status(200).json({
      success: true,
      subscription: newSubscription,
      subscriptionStatus: subscription.status,
      clientSecret,
      message: 'Subscription created. Confirm PaymentIntent if required.',
    })
  } catch (error) {
    logger.error({ event: 'create_subscription_error', requestId: req.id, error: error.message }, 'Could not create subscription')
    res.status(500).json({ success: false, message: 'Could not create subscription.', error: error.message })
  }
}

exports.cancelSubscription = async (req, res) => {
  try {
    if (!paymentService.isConfigured()) {
      return paymentService.sendNotConfiguredResponse(res)
    }

    const userId = req.user.id
    const { subscriptionId } = req.params
    if (!subscriptionId) {
      return res.status(400).json({ success: false, message: 'subscriptionId is required.' })
    }

    const subscription = await Subscription.findOne({ _id: subscriptionId, userId })
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found.' })
    }

    if (subscription.status === 'canceled' || !subscription.isActive) {
      return res.status(400).json({ success: false, message: 'Subscription is already cancelled or inactive.' })
    }

    const canceledSub = await paymentService.cancelSubscription(subscription.stripeSubscriptionId)
    subscription.status = canceledSub.status || 'canceled'
    subscription.isActive = false
    subscription.canceledAt = new Date()
    await subscription.save()

    logger.info({ event: 'subscription_cancelled_user', userId, subscriptionId: subscription._id }, 'Subscription cancelled by user')

    res.status(200).json({ success: true, message: 'Subscription canceled.', subscription })
  } catch (error) {
    logger.error({ event: 'cancel_subscription_error', requestId: req.id, error: error.message }, 'Could not cancel subscription')
    res.status(500).json({ success: false, message: 'Could not cancel subscription.', error: error.message })
  }
}

exports.getSubscriptionStatus = async (req, res) => {
  try {
    const userId = req.user.id
    const subscription = await Subscription.findOne({ userId }).sort({ createdAt: -1 })

    if (!subscription) {
      return res.status(404).json({ success: false, message: 'No subscription found for this user.' })
    }

    // Dynamic Expiration Check
    const now = new Date()
    if (subscription.isActive && subscription.expiresAt && subscription.expiresAt <= now) {
      subscription.isActive = false
      subscription.status = 'expired'
      await subscription.save()
      logger.info({ event: 'subscription_dynamically_expired', userId, subscriptionId: subscription._id }, 'Subscription dynamically marked expired')
    }

    res.status(200).json({ success: true, subscription })
  } catch (error) {
    logger.error({ event: 'get_subscription_status_error', requestId: req.id, error: error.message }, 'Failed to get subscription status')
    res.status(500).json({ success: false, message: 'Failed to get subscription status.', error: error.message })
  }
}