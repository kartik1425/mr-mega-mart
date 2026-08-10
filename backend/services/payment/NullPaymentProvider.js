const PaymentProvider = require('./PaymentProvider')

class NullPaymentProvider extends PaymentProvider {
  isConfigured() {
    return false
  }

  getProviderName() {
    return 'NullProvider'
  }

  async createPaymentIntent() {
    throw new Error('Payment gateway not configured.')
  }

  async createCustomer() {
    throw new Error('Payment gateway not configured.')
  }

  async attachPaymentMethod() {
    throw new Error('Payment gateway not configured.')
  }

  async updateCustomerDefaultPaymentMethod() {
    throw new Error('Payment gateway not configured.')
  }

  async createSubscription() {
    throw new Error('Payment gateway not configured.')
  }

  async cancelSubscription() {
    throw new Error('Payment gateway not configured.')
  }

  constructWebhookEvent() {
    throw new Error('Payment gateway not configured.')
  }
}

module.exports = NullPaymentProvider
