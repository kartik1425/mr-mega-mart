const StripeProvider = require('./StripeProvider')
const RazorpayProvider = require('./RazorpayProvider')
const NullPaymentProvider = require('./NullPaymentProvider')
const { logger, metrics } = require('../logger')

class PaymentService {
  constructor() {
    this.provider = this._resolveProvider()
  }

  _resolveProvider() {
    const stripeSecret = process.env.STRIPE_SECRET_KEY
    if (stripeSecret && stripeSecret.trim() !== '') {
      const stripeProvider = new StripeProvider(stripeSecret)
      if (stripeProvider.isConfigured()) {
        logger.info({ event: 'payment_provider_selected', provider: 'StripeProvider' }, '[PaymentService] Initialized with StripeProvider')
        return stripeProvider
      }
    }

    const razorpayKey = process.env.RAZORPAY_KEY_ID
    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET
    if (razorpayKey && razorpaySecret) {
      const razorpayProvider = new RazorpayProvider(razorpayKey, razorpaySecret)
      if (razorpayProvider.isConfigured()) {
        logger.info({ event: 'payment_provider_selected', provider: 'RazorpayProvider' }, '[PaymentService] Initialized with RazorpayProvider')
        return razorpayProvider
      }
    }

    logger.info({ event: 'payment_provider_selected', provider: 'NullPaymentProvider' }, '[PaymentService] No active payment gateway configured. Using NullPaymentProvider.')
    return new NullPaymentProvider()
  }

  isConfigured() {
    return this.provider.isConfigured()
  }

  getProviderName() {
    return this.provider.getProviderName()
  }

  getProvider() {
    return this.provider
  }

  /**
   * Helper middleware response for unconfigured payment endpoints.
   */
  sendNotConfiguredResponse(res) {
    metrics.increment('paymentFailures')
    logger.warn({ event: 'payment_not_configured', provider: this.getProviderName() }, 'Payment attempt rejected: Gateway not configured')
    return res.status(503).json({
      success: false,
      message: 'Payment gateway not configured.',
    })
  }

  async createPaymentIntent(options) {
    metrics.increment('paymentAttempts')
    return await this.provider.createPaymentIntent(options)
  }

  async createCustomer(options) {
    return await this.provider.createCustomer(options)
  }

  async attachPaymentMethod(paymentMethodId, customerId) {
    return await this.provider.attachPaymentMethod(paymentMethodId, customerId)
  }

  async updateCustomerDefaultPaymentMethod(customerId, paymentMethodId) {
    return await this.provider.updateCustomerDefaultPaymentMethod(customerId, paymentMethodId)
  }

  async createSubscription(options) {
    return await this.provider.createSubscription(options)
  }

  async cancelSubscription(subscriptionId) {
    return await this.provider.cancelSubscription(subscriptionId)
  }

  constructWebhookEvent(payload, signature, secret) {
    return this.provider.constructWebhookEvent(payload, signature, secret)
  }
}

// Export singleton instance
module.exports = new PaymentService()
