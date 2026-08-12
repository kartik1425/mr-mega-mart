const mongoose = require('mongoose')

const OrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    deliveryAddress: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserAddress',
      required: true,
    },
    paymentMethod: {
      type: String,
      default: 'CARD',
    },
    paymentId: {
      type: String,
    },
    paymentIntentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'usd',
    },
    status: {
      type: String,
      enum: ['pending', 'shipping', 'delivered', 'returned', 'cancelled', 'failed'],
      default: 'pending',
      index: true,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true, min: 0 },
      },
    ],
  },
  { timestamps: true }
)

OrderSchema.index({ userId: 1, createdAt: -1 })
OrderSchema.index({ userId: 1, status: 1 })

module.exports = mongoose.model('Order', OrderSchema)