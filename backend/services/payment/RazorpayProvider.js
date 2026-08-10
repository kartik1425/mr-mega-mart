const PaymentProvider = require('./PaymentProvider')

class RazorpayProvider extends PaymentProvider {
  constructor(keyId, keySecret) {
    super()
    this.keyId = keyId
    this.keySecret = keySecret
    // Placeholder for future Razorpay SDK instance
    this.razorpay = null
  }

  isConfigured() {
    return false
  }

  getProviderName() {
    return 'Razorpay'
  }
}

module.exports = RazorpayProvider
