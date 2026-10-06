const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true
  },
  password: {
    type: String,
    required: true,
    select: false // Do not return password by default
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  avatar: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['owner', 'admin'],
    default: 'owner'
  },
  securitySettings: {
    requireBiometrics: {
      type: Boolean,
      default: false
    },
    pinCode: {
      type: String,
      default: null,
      select: false
    }
  },
  lastLogin: {
    type: Date
  },
  resetOtp: {
    type: String,
    select: false
  },
  resetOtpExpires: {
    type: Date,
    select: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
