const StoreSettings = require('../models/StoreSettings')

// Haversine formula to compute distance in KM between two (lat, lng) pairs
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // Earth radius in KM
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c * 10) / 10 // Round to 1 decimal place
}

async function calculateDeliveryFeeForCart(cart, deliveryAddress) {
  let settings = await StoreSettings.findOne()
  if (!settings) {
    settings = {
      latitude: 28.6139,
      longitude: 77.209,
      baseDeliveryFee: 20,
      perKmFee: 10,
      freeDeliveryThreshold: 500,
      pincode: '110001',
    }
  }

  // Calculate cart total for free delivery check
  const totalAmount = cart.items.reduce((sum, item) => {
    if (!item.productId) return sum
    const price = item.productId.salePrice ?? item.productId.price ?? 0
    return sum + item.quantity * price
  }, 0)

  if (settings.freeDeliveryThreshold > 0 && totalAmount >= settings.freeDeliveryThreshold) {
    return {
      distanceKm: 0,
      deliveryFee: 0,
      isFreeDelivery: true,
      freeDeliveryThreshold: settings.freeDeliveryThreshold,
    }
  }

  let distanceKm = 3 // Default estimated distance in KM if coordinates not available

  if (
    deliveryAddress &&
    typeof deliveryAddress.latitude === 'number' &&
    typeof deliveryAddress.longitude === 'number' &&
    deliveryAddress.latitude !== 0
  ) {
    distanceKm = calculateHaversineDistance(
      settings.latitude,
      settings.longitude,
      deliveryAddress.latitude,
      deliveryAddress.longitude
    )
    if (distanceKm < 1) distanceKm = 1 // Minimum 1 km
  } else if (deliveryAddress && deliveryAddress.pincode) {
    // Basic pincode estimation fallback
    if (deliveryAddress.pincode === settings.pincode) {
      distanceKm = 2.5
    } else {
      const pinDiff = Math.abs(parseInt(deliveryAddress.pincode) - parseInt(settings.pincode))
      distanceKm = Math.min(Math.max(pinDiff, 3), 25)
    }
  }

  const deliveryFee = Math.round(distanceKm * settings.perKmFee + settings.baseDeliveryFee)

  return {
    distanceKm,
    deliveryFee,
    perKmFee: settings.perKmFee,
    baseDeliveryFee: settings.baseDeliveryFee,
    isFreeDelivery: false,
    freeDeliveryThreshold: settings.freeDeliveryThreshold,
  }
}

module.exports = {
  calculateHaversineDistance,
  calculateDeliveryFeeForCart,
}
