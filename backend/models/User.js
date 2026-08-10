const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema(
  {
    userFirstName: { type: String, required: true, trim: true },
    userLastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    emailVerified: { type: Boolean, default: false },
    password: { type: String, required: true },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer', index: true },
    refreshToken: { type: String, index: true },
    stripeCustomerId: { type: String, default: null, index: true, sparse: true },
  },
  { timestamps: true }
)

module.exports = mongoose.model('User', UserSchema)