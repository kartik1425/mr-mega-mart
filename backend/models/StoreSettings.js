const mongoose = require("mongoose")

const StoreSettingsSchema = new mongoose.Schema(
  {
    shopName: {
      type: String,
      default: "MR Mega Mart Main Store",
    },
    shopAddress: {
      type: String,
      default: "Main Market Road, Central Plaza",
    },
    city: {
      type: String,
      default: "Delhi",
    },
    state: {
      type: String,
      default: "Delhi",
    },
    pincode: {
      type: String,
      default: "110001",
    },
    latitude: {
      type: Number,
      default: 28.6139,
    },
    longitude: {
      type: Number,
      default: 77.209,
    },
    baseDeliveryFee: {
      type: Number,
      default: 20,
    },
    perKmFee: {
      type: Number,
      default: 10,
    },
    freeDeliveryThreshold: {
      type: Number,
      default: 500,
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model("StoreSettings", StoreSettingsSchema)
