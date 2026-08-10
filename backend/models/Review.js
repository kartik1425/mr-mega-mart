const mongoose = require('mongoose')

const ReviewSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true }
)

// Compound unique index to prevent duplicate reviews for the same order item
ReviewSchema.index({ userId: 1, productId: 1, orderId: 1 }, { unique: true })
ReviewSchema.index({ productId: 1, createdAt: -1 })

module.exports = mongoose.model('Review', ReviewSchema)