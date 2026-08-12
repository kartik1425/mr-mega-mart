const User = require('../models/User')
const argon2 = require('argon2')
const { logger } = require('./logger')
const { createEmptyCartForUser } = require('../controllers/cartController')

async function seedAdminUser() {
  try {
    const adminEmail = 'admin@mrmegamart.com'
    const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123456'

    let admin = await User.findOne({ email: adminEmail })

    if (!admin) {
      const hashedPassword = await argon2.hash(defaultPassword, {
        type: argon2.argon2id,
      })

      admin = new User({
        userFirstName: 'MR Mega Mart',
        userLastName: 'Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        emailVerified: true,
      })

      await admin.save()
      await createEmptyCartForUser(admin._id)
      logger.info({ event: 'admin_seeded', email: adminEmail }, 'Default admin user seeded successfully.')
    } else if (admin.role !== 'admin') {
      admin.role = 'admin'
      await admin.save()
      logger.info({ event: 'admin_role_updated', email: adminEmail }, 'Existing user updated to admin role.')
    }
  } catch (error) {
    logger.error({ event: 'seed_admin_error', error: error.message }, 'Failed to seed admin user.')
  }
}

module.exports = { seedAdminUser }
