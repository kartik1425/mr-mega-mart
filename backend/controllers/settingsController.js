const StoreSettings = require("../models/StoreSettings")

exports.getStoreSettings = async (req, res) => {
  try {
    let settings = await StoreSettings.findOne()
    if (!settings) {
      settings = await StoreSettings.create({})
    }
    res.status(200).json({
      success: true,
      settings,
    })
  } catch (error) {
    console.error("Error fetching store settings:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch store settings",
      error: error.message,
    })
  }
}

exports.updateStoreSettings = async (req, res) => {
  try {
    const {
      shopName,
      shopAddress,
      city,
      state,
      pincode,
      latitude,
      longitude,
      baseDeliveryFee,
      perKmFee,
      freeDeliveryThreshold,
    } = req.body

    let settings = await StoreSettings.findOne()
    if (!settings) {
      settings = new StoreSettings({})
    }

    if (shopName !== undefined) settings.shopName = shopName
    if (shopAddress !== undefined) settings.shopAddress = shopAddress
    if (city !== undefined) settings.city = city
    if (state !== undefined) settings.state = state
    if (pincode !== undefined) settings.pincode = pincode
    if (latitude !== undefined) settings.latitude = Number(latitude)
    if (longitude !== undefined) settings.longitude = Number(longitude)
    if (baseDeliveryFee !== undefined) settings.baseDeliveryFee = Number(baseDeliveryFee)
    if (perKmFee !== undefined) settings.perKmFee = Number(perKmFee)
    if (freeDeliveryThreshold !== undefined) settings.freeDeliveryThreshold = Number(freeDeliveryThreshold)

    await settings.save()

    res.status(200).json({
      success: true,
      message: "Store settings updated successfully",
      settings,
    })
  } catch (error) {
    console.error("Error updating store settings:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update store settings",
      error: error.message,
    })
  }
}
