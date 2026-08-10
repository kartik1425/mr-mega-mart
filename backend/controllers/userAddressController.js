const UserAddress = require('../models/UserAddress')
const { logger } = require('../services/logger')

exports.createAddress = async (req, res) => {
  try {
    const userId = req.user.id
    const { fullName, phoneNumber, address, city, state, postalCode, country, addressType, isDefault } = req.body

    const hasDefaultAddress = await UserAddress.exists({ userId, isDefault: true })
    const setAsDefault = isDefault !== undefined ? Boolean(isDefault) : !hasDefaultAddress

    const safeFullName = (fullName || req.body.contactName || req.body.addressTitle || 'Customer').trim()
    const safePhoneNumber = (phoneNumber || req.body.phone || '0000000000').trim()
    const safeAddress = (address || req.body.fullAddress || req.body.street || 'Address').trim()
    const safeCity = (city || 'City').trim()
    const safeState = (state || req.body.district || 'State').trim()
    const safePostalCode = (postalCode || req.body.zipCode || '000000').trim()

    const newAddress = new UserAddress({
      userId,
      fullName: safeFullName,
      phoneNumber: safePhoneNumber,
      address: safeAddress,
      city: safeCity,
      state: safeState,
      postalCode: safePostalCode,
      country: country ? country.trim() : 'India',
      addressType: addressType || 'home',
      isDefault: setAsDefault,
    })

    await newAddress.save()

    if (newAddress.isDefault) {
      await checkForDefaultAddress(userId, newAddress._id)
    }

    logger.info({ event: 'address_created', userId, addressId: newAddress._id, isDefault: newAddress.isDefault }, 'Address created successfully')

    res.status(201).json({
      success: true,
      message: 'Address created successfully',
      address: newAddress,
    })
  } catch (error) {
    logger.error({ event: 'create_address_error', requestId: req.id, error: error.message }, 'Error creating address')
    res.status(500).json({
      success: false,
      message: 'Failed to create address',
      error: error.message,
    })
  }
}

exports.getUserAddresses = async (req, res) => {
  try {
    const userId = req.user.id

    const addresses = await UserAddress.find({ userId }).sort({ isDefault: -1, updatedAt: -1 }).lean()
    res.status(200).json({
      success: true,
      addresses,
    })
  } catch (error) {
    logger.error({ event: 'get_user_addresses_error', requestId: req.id, error: error.message }, 'Error fetching user addresses')
    res.status(500).json({
      success: false,
      message: 'Failed to fetch addresses',
      error: error.message,
    })
  }
}

exports.deleteAddress = async (req, res) => {
  try {
    const userId = req.user.id
    const { addressId } = req.params

    const address = await UserAddress.findById(addressId)

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found',
      })
    }

    if (address.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this address',
      })
    }

    const wasDefault = address.isDefault
    await UserAddress.findByIdAndDelete(addressId)

    // If deleted address was default, promote the latest remaining address to default
    if (wasDefault) {
      const latestRemaining = await UserAddress.findOne({ userId }).sort({ updatedAt: -1 })
      if (latestRemaining) {
        latestRemaining.isDefault = true
        await latestRemaining.save()
        logger.info({ event: 'default_address_reassigned', userId, newDefaultId: latestRemaining._id }, 'Reassigned default address after deletion')
      }
    }

    logger.info({ event: 'address_deleted', userId, addressId }, 'Address deleted successfully')

    res.status(200).json({
      success: true,
      message: 'Address deleted successfully',
    })
  } catch (error) {
    logger.error({ event: 'delete_address_error', requestId: req.id, error: error.message }, 'Error deleting address')
    res.status(500).json({
      success: false,
      message: 'Failed to delete address',
      error: error.message,
    })
  }
}

exports.updateAddress = async (req, res) => {
  try {
    const userId = req.user.id
    const { addressId } = req.params
    const { fullName, phoneNumber, address, city, state, postalCode, country, addressType, isDefault } = req.body

    const addressToUpdate = await UserAddress.findById(addressId)

    if (!addressToUpdate) {
      return res.status(404).json({
        success: false,
        message: 'Address not found',
      })
    }

    if (addressToUpdate.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this address',
      })
    }

    addressToUpdate.fullName = fullName !== undefined ? fullName.trim() : addressToUpdate.fullName
    addressToUpdate.phoneNumber = phoneNumber !== undefined ? phoneNumber.trim() : addressToUpdate.phoneNumber
    addressToUpdate.address = address !== undefined ? address.trim() : addressToUpdate.address
    addressToUpdate.city = city !== undefined ? city.trim() : addressToUpdate.city
    addressToUpdate.state = state !== undefined ? state.trim() : addressToUpdate.state
    addressToUpdate.postalCode = postalCode !== undefined ? postalCode.trim() : addressToUpdate.postalCode
    addressToUpdate.country = country !== undefined ? country.trim() : addressToUpdate.country
    addressToUpdate.addressType = addressType !== undefined ? addressType : addressToUpdate.addressType

    // Fix boolean logic bug: Explicitly check for boolean type
    const newIsDefault = isDefault !== undefined ? Boolean(isDefault) : addressToUpdate.isDefault
    addressToUpdate.isDefault = newIsDefault

    await addressToUpdate.save()

    if (addressToUpdate.isDefault) {
      await checkForDefaultAddress(userId, addressToUpdate._id)
    }

    logger.info({ event: 'address_updated', userId, addressId, isDefault: addressToUpdate.isDefault }, 'Address updated successfully')

    res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      address: addressToUpdate,
    })
  } catch (error) {
    logger.error({ event: 'update_address_error', requestId: req.id, error: error.message }, 'Error updating address')
    res.status(500).json({
      success: false,
      message: 'Failed to update address',
      error: error.message,
    })
  }
}

exports.getDefaultAddress = async (req, res) => {
  try {
    const userId = req.user.id

    const defaultAddress = await UserAddress.findOne({ userId, isDefault: true }).lean()

    if (!defaultAddress) {
      return res.status(404).json({
        success: false,
        message: 'No default address found',
      })
    }

    res.status(200).json({
      success: true,
      address: defaultAddress,
    })
  } catch (error) {
    logger.error({ event: 'get_default_address_error', requestId: req.id, error: error.message }, 'Error fetching default address')
    res.status(500).json({
      success: false,
      message: 'Failed to fetch default address',
      error: error.message,
    })
  }
}

async function checkForDefaultAddress(userId, addressIdToExclude = null) {
  try {
    const filter = { userId, _id: { $ne: addressIdToExclude } }
    await UserAddress.updateMany(filter, { isDefault: false })
  } catch (error) {
    logger.error({ event: 'check_default_address_error', userId, error: error.message }, 'Error updating default addresses')
    throw new Error('Failed to update default addresses')
  }
}