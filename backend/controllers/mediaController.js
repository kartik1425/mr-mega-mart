const cloudinaryService = require('../services/cloudinaryStorageService')
const { logger } = require('../services/logger')

exports.getSignParameters = async (req, res) => {
  try {
    const { folder = 'mrmegamart/products' } = req.body || {}

    if (!cloudinaryService.isConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in server environment.',
      })
    }

    const signData = cloudinaryService.generateSignature({ folder })

    res.status(200).json({
      success: true,
      ...signData,
    })
  } catch (error) {
    logger.error({ event: 'media_sign_error', requestId: req.id, error: error.message }, 'Failed to generate Cloudinary signature')
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate upload signature.',
    })
  }
}

exports.deleteMedia = async (req, res) => {
  try {
    const { publicId } = req.body || {}

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: 'publicId is required.',
      })
    }

    if (!cloudinaryService.isConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Cloudinary is not configured on the server.',
      })
    }

    const result = await cloudinaryService.deleteMedia(publicId)

    res.status(200).json({
      success: true,
      result,
      message: 'Media deleted successfully.',
    })
  } catch (error) {
    logger.error({ event: 'media_delete_error', requestId: req.id, error: error.message }, 'Failed to delete media')
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete media.',
    })
  }
}
