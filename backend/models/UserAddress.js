const mongoose = require('mongoose')

const UserAddressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    postalCode: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      default: 'USA',
      trim: true,
    },
    addressType: {
      type: String,
      enum: ['home', 'work', 'other'],
      required: true,
      default: 'home',
    },
    isDefault: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
)

UserAddressSchema.index({ userId: 1, isDefault: 1 })

module.exports = mongoose.model('UserAddress', UserAddressSchema)