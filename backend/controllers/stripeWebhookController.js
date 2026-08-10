const paymentService = require('../services/payment')
const { fetchCartAndCreateOrder } = require('./paymentController')
const Subscription = require('../models/Subscription')
const Order = require('../models/Order')
const { logger } = require('../services/logger')

exports.handleStripeWebhook = async (req, res) => {
  if (!paymentService.isConfigured()) {
    return paymentService.sendNotConfiguredResponse(res)
  }

  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET
  const sig = req.headers['stripe-signature']
  let event
  try {
    event = paymentService.constructWebhookEvent(req.body, sig, endpointSecret)
  } catch (err) {
    logger.warn({ event: 'stripe_webhook_signature_error', error: err.message }, `Webhook Signature Error: ${err.message}`)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  logger.info({ event: 'stripe_webhook_received', eventType: event.type, eventId: event.id }, `Received Stripe webhook: ${event.type}`)

  switch (event.type) {
    case 'payment_intent.created': {
      break
    }
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object
      const userId = paymentIntent.metadata ? paymentIntent.metadata.userId : null

      if (userId) {
        // Pre-query idempotency check for Stripe webhooks
        const existingOrder = await Order.findOne({ paymentIntentId: paymentIntent.id })
        if (existingOrder) {
          logger.info({ event: 'webhook_duplicate_prevented', paymentIntentId: paymentIntent.id, orderId: existingOrder._id }, 'Webhook retry ignored; order already exists')
          break
        }

        const result = await fetchCartAndCreateOrder(userId, paymentIntent)
        if (!result.success) {
          logger.error({ event: 'webhook_order_creation_failed', paymentIntentId: paymentIntent.id, reason: result.message }, 'Failed to create order from webhook event')
        }
      }
      break
    }
    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object
      logger.warn({ event: 'payment_intent_failed', paymentIntentId: paymentIntent.id }, 'PaymentIntent failed notification received')
      break
    }
    case 'customer.subscription.created': {
      break
    }
    case 'customer.subscription.updated': {
      const subscription = event.data.object
      const localSub = await Subscription.findOne({ stripeSubscriptionId: subscription.id })
      if (localSub) {
        localSub.status = subscription.status
        localSub.isActive = subscription.status === 'active'
        if (subscription.current_period_end) {
          localSub.expiresAt = new Date(subscription.current_period_end * 1000)
        }
        if (subscription.status === 'canceled') {
          localSub.isActive = false
          localSub.canceledAt = new Date()
        }
        await localSub.save()
        logger.info({ event: 'subscription_updated', stripeSubscriptionId: subscription.id, status: subscription.status }, 'Subscription updated via webhook')
      }
      break
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object
      const localSub = await Subscription.findOne({ stripeSubscriptionId: subscription.id })
      if (localSub) {
        localSub.status = 'canceled'
        localSub.isActive = false
        localSub.canceledAt = new Date()
        await localSub.save()
        logger.info({ event: 'subscription_cancelled', stripeSubscriptionId: subscription.id }, 'Subscription cancelled via webhook')
      }
      break
    }
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object
      if (invoice.subscription) {
        const localSub = await Subscription.findOne({ stripeSubscriptionId: invoice.subscription })
        if (localSub && localSub.status === 'incomplete') {
          localSub.status = 'active'
          localSub.isActive = true
          await localSub.save()
          logger.info({ event: 'invoice_payment_succeeded', stripeSubscriptionId: invoice.subscription }, 'Invoice payment succeeded for subscription')
        }
      }
      break
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object
      if (invoice.subscription) {
        const localSub = await Subscription.findOne({ stripeSubscriptionId: invoice.subscription })
        if (localSub) {
          localSub.status = 'past_due'
          localSub.isActive = false
          await localSub.save()
          logger.warn({ event: 'invoice_payment_failed', stripeSubscriptionId: invoice.subscription }, 'Invoice payment failed for subscription')
        }
      }
      break
    }
    default: {
      break
    }
  }

  res.status(200).json({ received: true })
}