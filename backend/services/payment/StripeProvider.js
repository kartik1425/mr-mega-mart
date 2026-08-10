const PaymentProvider = require('./PaymentProvider')
const Stripe = require('stripe')

class StripeProvider extends PaymentProvider {
  constructor(apiKey) {
    super()
    this.apiKey = apiKey
    if (this.apiKey && this.apiKey.trim() !== '') {
      this.stripe = new Stripe(this.apiKey)
    } else {
      this.stripe = null
    }
  }

  isConfigured() {
    return !!this.stripe
  }

  getProviderName() {
    return 'Stripe'
  }

  async createPaymentIntent({ amount, currency = 'usd', description = 'E-commerce Payment', metadata = {}, idempotencyKey }) {
    if (!this.isConfigured()) {
      throw new Error('Stripe is not configured.')
    }

    const options = idempotencyKey ? { idempotencyKey } : undefined

    return await this.stripe.paymentIntents.create(
      {
        amount: Math.round(amount * 100),
        currency,
        description,
        automatic_payment_methods: {
          enabled: true,
        },
        metadata,
      },
      options
    )
  }

  async createCustomer({ email, name }) {
    if (!this.isConfigured()) {
      throw new Error('Stripe is not configured.')
    }

    return await this.stripe.customers.create({ email, name })
  }

  async attachPaymentMethod(paymentMethodId, customerId) {
    if (!this.isConfigured()) {
      throw new Error('Stripe is not configured.')
    }

    return await this.stripe.paymentMethods.attach(paymentMethodId, { customer: customerId })
  }

  async updateCustomerDefaultPaymentMethod(customerId, paymentMethodId) {
    if (!this.isConfigured()) {
      throw new Error('Stripe is not configured.')
    }

    return await this.stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    })
  }

  async createSubscription({ customerId, priceId, paymentMethodId }) {
    if (!this.isConfigured()) {
      throw new Error('Stripe is not configured.')
    }

    return await this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
      default_payment_method: paymentMethodId,
    })
  }

  async cancelSubscription(stripeSubscriptionId) {
    if (!this.isConfigured()) {
      throw new Error('Stripe is not configured.')
    }

    return await this.stripe.subscriptions.cancel(stripeSubscriptionId)
  }

  constructWebhookEvent(payload, signature, secret) {
    if (!this.isConfigured()) {
      throw new Error('Stripe is not configured.')
    }

    return this.stripe.webhooks.constructEvent(payload, signature, secret)
  }
}

module.exports = StripeProvider
