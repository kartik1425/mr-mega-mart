const cloudinary = require('cloudinary').v2
const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} = require('../config/env')
const { logger } = require('./logger')

if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  })
}

function isConfigured() {
  return !!(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET)
}

function generateSignature({ folder = 'mrmegamart/products' } = {}) {
  if (!isConfigured()) {
    throw new Error('Cloudinary credentials are not configured on the server.')
  }

  const timestamp = Math.round(new Date().getTime() / 1000)
  const paramsToSign = {
    timestamp,
    folder,
  }

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    CLOUDINARY_API_SECRET
  )

  return {
    signature,
    timestamp,
    apiKey: CLOUDINARY_API_KEY,
    cloudName: CLOUDINARY_CLOUD_NAME,
    folder,
  }
}

async function deleteMedia(publicId) {
  if (!isConfigured()) {
    throw new Error('Cloudinary credentials are not configured on the server.')
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId)
    return result
  } catch (error) {
    logger.error({ event: 'cloudinary_delete_error', publicId, error: error.message }, 'Failed to delete media from Cloudinary')
    throw error
  }
}

module.exports = {
  isConfigured,
  generateSignature,
  deleteMedia,
}
