/**
 * ============================================
 * AUTHENTICATION CONTROLLER
 * ============================================
 * Handles user registration, login, logout
 */

const User = require('../models/User');
const { generateToken } = require('../utils/generateToken');
const { ErrorResponse, asyncHandler } = require('../middleware/errorHandler');
const crypto = require('crypto');

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = asyncHandler(async (req, res, next) => {
  const { fullName, email, password, phone, address } = req.body;
  
  // Validate required fields
  if (!fullName || !email || !password || !phone) {
    return next(new ErrorResponse('Please provide all required fields', 400));
  }
  
  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorResponse('Email already registered', 400));
  }
  
  // Create user
  const user = await User.create({
    fullName,
    email,
    password,
    phone,
    address: address || {}
  });
  
  // Generate token
  const token = generateToken(user._id, user.email, user.role);
  
  // Send response
  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: {
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        address: user.address
      }
    }
  });
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  
  // Validate required fields
  if (!email || !password) {
    return next(new ErrorResponse('Please provide email and password', 400));
  }
  
  // Find user and include password field
  const user = await User.findOne({ email }).select('+password');
  
  if (!user) {
    return next(new ErrorResponse('Invalid email or password', 401));
  }
  
  // Check password
  const isPasswordMatch = await user.comparePassword(password);
  
  if (!isPasswordMatch) {
    return next(new ErrorResponse('Invalid email or password', 401));
  }
  
  // Update last login
  user.lastLogin = Date.now();
  await user.save({ validateBeforeSave: false });
  
  // Generate token
  const token = generateToken(user._id, user.email, user.role);
  
  // Send response (exclude password)
  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        address: user.address,
        lastLogin: user.lastLogin
      }
    }
  });
});

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  res.status(200).json({
    success: true,
    data: {
      user
    }
  });
});

/**
 * @desc    Logout user (client-side token removal)
 * @route   POST /api/auth/logout
 * @access  Private
 */
exports.logout = asyncHandler(async (req, res, next) => {
  // Note: With JWT, logout is handled client-side by removing the token
  // This endpoint is mainly for consistency and future token blacklisting
  
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
    data: {}
  });
});

/**
 * @desc    Forgot password - Send reset token to email
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  
  if (!email) {
    return next(new ErrorResponse('Please provide an email', 400));
  }
  
  const user = await User.findOne({ email });
  
  if (!user) {
    return next(new ErrorResponse('No user found with that email', 404));
  }
  
  // Generate reset token
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });
  
  // Create reset URL
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  
  // TODO: Send email with reset link (implement in Phase 5)
  // For now, just return the token (REMOVE IN PRODUCTION!)
  
  res.status(200).json({
    success: true,
    message: 'Password reset email sent',
    data: {
      resetToken, // REMOVE THIS IN PRODUCTION
      resetUrl
    }
  });
});

/**
 * @desc    Reset password
 * @route   PUT /api/auth/reset-password/:token
 * @access  Public
 */
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const { password } = req.body;
  const { token } = req.params;
  
  if (!password) {
    return next(new ErrorResponse('Please provide a new password', 400));
  }
  
  // Hash token to match database
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  // Find user with valid reset token
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });
  
  if (!user) {
    return next(new ErrorResponse('Invalid or expired reset token', 400));
  }
  
  // Set new password
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  
  // Generate new token
  const authToken = generateToken(user._id, user.email, user.role);
  
  res.status(200).json({
    success: true,
    message: 'Password reset successful',
    data: {
      token: authToken
    }
  });
});