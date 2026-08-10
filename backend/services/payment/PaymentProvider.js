/**
 * Abstract Base Class / Interface for Payment Providers
 */
class PaymentProvider {
  /**
   * Indicates whether the payment provider is properly configured with credentials.
   * @returns {boolean}
   */
  isConfigured() {
    return false
  }

  /**
   * Name of the provider.
   * @returns {string}
   */
  getProviderName() {
    return 'BaseProvider'
  }

  /**
   * Create a payment intent for purchasing items.
   * @param {Object} options - Payment intent options (amount, currency, metadata, etc.)
   */
  async createPaymentIntent(options) {
    throw new Error('Method createPaymentIntent() not implemented.')
  }

  /**
   * Create a customer profile on the payment gateway.
   * @param {Object} options - Customer details (email, name, metadata)
   */
  async createCustomer(options) {
    throw new Error('Method createCustomer() not implemented.')
  }

  /**
   * Attach payment method to a customer.
   */
  async attachPaymentMethod(paymentMethodId, customerId) {
    throw new Error('Method attachPaymentMethod() not implemented.')
  }

  /**
   * Update customer default payment method.
   */
  async updateCustomerDefaultPaymentMethod(customerId, paymentMethodId) {
    throw new Error('Method updateCustomerDefaultPaymentMethod() not implemented.')
  }

  /**
   * Create a recurring subscription.
   */
  async createSubscription(options) {
    throw new Error('Method createSubscription() not implemented.')
  }

  /**
   * Cancel an active subscription.
   */
  async cancelSubscription(subscriptionId) {
    throw new Error('Method cancelSubscription() not implemented.')
  }

  /**
   * Construct and verify incoming webhook event.
   */
  constructWebhookEvent(payload, signature, secret) {
    throw new Error('Method constructWebhookEvent() not implemented.')
  }
}

module.exports = PaymentProvider
