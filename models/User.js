// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['superadmin', 'admin', 'user'], default: 'user' },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  resetPasswordOtp: String,
  resetPasswordOtpExpire: Date
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.getResetPasswordToken = function () {
  const crypto = require('crypto');
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

userSchema.methods.generateOtp = function () {
  const crypto = require('crypto');
  // Generate a random 6-digit number
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Hash OTP and set to resetPasswordOtp field
  this.resetPasswordOtp = crypto
    .createHash('sha256')
    .update(otp)
    .digest('hex');

  // Set expire (10 minutes)
  this.resetPasswordOtpExpire = Date.now() + 10 * 60 * 1000;

  return otp;
};

module.exports = mongoose.model('User', userSchema);
