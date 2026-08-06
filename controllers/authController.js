const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const sendEmail = require('../utils/sendEmail');

const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '1d'
  });
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email and password', 400));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  const token = generateToken(user);
  res.json({
    success: true,
    token,
    user: { id: user._id, _id: user._id, email: user.email, role: user.role }
  });
});

// @desc    Edit user credentials
// @route   PUT /api/auth/edit
// @access  Private
exports.editCredentials = asyncHandler(async (req, res, next) => {
  const { currentPassword, newEmail, newPassword } = req.body;
  const userId = req.user.id;

  const user = await User.findById(userId).select('+password');

  if (!user || !(await user.comparePassword(currentPassword))) {
    return next(new ErrorResponse('Incorrect current password', 401));
  }

  if (newEmail) {
    user.email = newEmail;
  }

  if (newPassword) {
    user.password = newPassword;
  }

  await user.save();

  res.json({
    success: true,
    message: 'Credentials updated successfully',
    user: { id: user._id, email: user.email },
  });
});

// @desc    Forgot Password (Send OTP)
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorResponse('There is no user with that email', 404));
  }

  // Generate OTP
  const otp = user.generateOtp();

  await user.save({ validateBeforeSave: false });

  const message = `
    <h1>Password Reset OTP</h1>
    <p>Your OTP (One-Time Password) for password reset is:</p>
    <h2 style="color: red;">${otp}</h2>
    <p>This OTP is valid for 10 minutes. Do not share this code with anyone.</p>
  `;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password Reset OTP - Tridev Labels',
      html: message,
    });

    res.status(200).json({ success: true, data: 'OTP Sent' });
  } catch (err) {
    console.log(err);
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse('Email could not be sent', 500));
  }
});

// @desc    Verify OTP
// @route   POST /api/auth/verifyotp
// @access  Public
exports.verifyOtp = asyncHandler(async (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return next(new ErrorResponse('Please provide email and OTP', 400));
  }

  // Hash the OTP to compare
  const resetPasswordOtp = crypto
    .createHash('sha256')
    .update(otp)
    .digest('hex');

  const user = await User.findOne({
    email,
    resetPasswordOtp,
    resetPasswordOtpExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorResponse('Invalid or expired OTP', 400));
  }

  // OTP valid. Clear OTP and generate a temporary reset token for the next step
  user.resetPasswordOtp = undefined;
  user.resetPasswordOtpExpire = undefined;
  
  const resetToken = user.getResetPasswordToken(); // Reusing this to generate a token
  
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    resetToken
  });
});

// @desc    Reset password
// @route   PUT /api/auth/resetpassword
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const { token, password } = req.body;

  if (!token || !password) {
     return next(new ErrorResponse('Missing credentials', 400));
  }

  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorResponse('Invalid or expired reset session', 400));
  }

  // Set new password
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  const newToken = generateToken(user);
    res.json({
    success: true,
    token: newToken,
    user: { id: user._id, email: user.email, role: user.role }
  });
});

// @desc    Create a new Admin (Super Admin only)
// @route   POST /api/auth/create-admin
// @access  Private (Super Admin)
exports.createAdmin = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;

  // Check if user exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    return next(new ErrorResponse('User already exists', 400));
  }

  // Create user with 'admin' role
  const user = await User.create({
    name,
    email,
    password,
    role: 'admin' 
  });

  res.status(201).json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

// @desc    Get all Admins (Super Admin only)
// @route   GET /api/auth/admins
// @access  Private (Super Admin)
exports.getAllAdmins = asyncHandler(async (req, res, next) => {
  // Fetch users with role 'admin'
  const users = await User.find({ role: 'admin' }).select('-password');

  res.status(200).json({
    success: true,
    count: users.length,
    data: users
  });
});

// @desc    Delete an Admin (Super Admin only)
// @route   DELETE /api/auth/admin/:id
// @access  Private (Super Admin)
exports.deleteAdmin = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  // Prevent deleting self or other superadmins (optional safety)
  if (user.role === 'superadmin') {
     return next(new ErrorResponse('Cannot delete a Super Admin', 403));
  }

  await user.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});
