/**
 * ============================================
 * USER CONTROLLER (STANDARDIZED)
 * ============================================
 * Handles user profile management
 */

const User = require('../models/User');
const { ErrorResponse, asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Get user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
exports.getProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }
  
  res.status(200).json({
    success: true,
    data: { user }
  });
});

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const { fullName, phone } = req.body;
  
  const user = await User.findById(req.user.id);
  
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }
  
  // Update fields if provided
  if (fullName) user.fullName = fullName;
  if (phone) user.phone = phone;
  
  await user.save();
  
  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: { user }
  });
});

/**
 * @desc    Change password
 * @route   PUT /api/users/change-password
 * @access  Private
 */
exports.changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    return next(new ErrorResponse('Please provide current and new password', 400));
  }
  
  if (newPassword.length < 6) {
    return next(new ErrorResponse('New password must be at least 6 characters', 400));
  }
  
  // Get user with password
  const user = await User.findById(req.user.id).select('+password');
  
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }
  
  // Check current password
  const isMatch = await user.comparePassword(currentPassword);
  
  if (!isMatch) {
    return next(new ErrorResponse('Current password is incorrect', 401));
  }
  
  // Update password
  user.password = newPassword;
  await user.save();
  
  res.status(200).json({
    success: true,
    message: 'Password changed successfully',
    data: {}
  });
});

/**
 * @desc    Delete user account
 * @route   DELETE /api/users/account
 * @access  Private
 */
exports.deleteAccount = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }
  
  // Prevent admin from deleting their own account
  if (user.role === 'admin') {
    return next(new ErrorResponse('Admins cannot delete their own account', 403));
  }
  
  await user.deleteOne();
  
  res.status(200).json({
    success: true,
    message: 'Account deleted successfully',
    data: {}
  });
});

/**
 * @desc    Get all user addresses
 * @route   GET /api/users/addresses
 * @access  Private
 */
exports.getAddresses = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('addresses');
  
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }
  
  res.status(200).json({
    success: true,
    data: {
      addresses: user.addresses || []
    }
  });
});

/**
 * @desc    Add new address
 * @route   POST /api/users/addresses
 * @access  Private
 */
exports.addAddress = asyncHandler(async (req, res, next) => {
  const { street, city, state, zipCode, country, isDefault } = req.body;
  
  if (!street || !city || !country) {
    return next(new ErrorResponse('Street, city, and country are required', 400));
  }
  
  const user = await User.findById(req.user.id);
  
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }
  
  // If this is the first address or isDefault is true, make it default
  const shouldBeDefault = !user.addresses || user.addresses.length === 0 || isDefault;
  
  // If making this default, unset other default addresses
  if (shouldBeDefault && user.addresses) {
    user.addresses.forEach(addr => {
      addr.isDefault = false;
    });
  }
  
  // Add new address
  const newAddress = {
    street,
    city,
    state,
    zipCode,
    country,
    isDefault: shouldBeDefault
  };
  
  if (!user.addresses) {
    user.addresses = [];
  }
  
  user.addresses.push(newAddress);
  await user.save();
  
  res.status(201).json({
    success: true,
    message: 'Address added successfully',
    data: {
      address: user.addresses[user.addresses.length - 1]
    }
  });
});

/**
 * @desc    Update address
 * @route   PUT /api/users/addresses/:addressId
 * @access  Private
 */
exports.updateAddress = asyncHandler(async (req, res, next) => {
  const { addressId } = req.params;
  const { street, city, state, zipCode, country, isDefault } = req.body;
  
  const user = await User.findById(req.user.id);
  
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }
  
  // Find address
  const address = user.addresses.id(addressId);
  
  if (!address) {
    return next(new ErrorResponse('Address not found', 404));
  }
  
  // Update fields
  if (street) address.street = street;
  if (city) address.city = city;
  if (state !== undefined) address.state = state;
  if (zipCode !== undefined) address.zipCode = zipCode;
  if (country) address.country = country;
  
  // Handle default address
  if (isDefault === true) {
    user.addresses.forEach(addr => {
      addr.isDefault = false;
    });
    address.isDefault = true;
  }
  
  await user.save();
  
  res.status(200).json({
    success: true,
    message: 'Address updated successfully',
    data: { address }
  });
});

/**
 * @desc    Delete address
 * @route   DELETE /api/users/addresses/:addressId
 * @access  Private
 */
exports.deleteAddress = asyncHandler(async (req, res, next) => {
  const { addressId } = req.params;
  
  const user = await User.findById(req.user.id);
  
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }
  
  // Find address
  const address = user.addresses.id(addressId);
  
  if (!address) {
    return next(new ErrorResponse('Address not found', 404));
  }
  
  // If deleting default address, set another as default
  const wasDefault = address.isDefault;
  
  // Remove address
  user.addresses.pull(addressId);
  
  // If it was default and there are remaining addresses, make first one default
  if (wasDefault && user.addresses.length > 0) {
    user.addresses[0].isDefault = true;
  }
  
  await user.save();
  
  res.status(200).json({
    success: true,
    message: 'Address deleted successfully',
    data: {}
  });
});

/**
 * @desc    Set default address
 * @route   PATCH /api/users/addresses/:addressId/default
 * @access  Private
 */
exports.setDefaultAddress = asyncHandler(async (req, res, next) => {
  const { addressId } = req.params;
  
  const user = await User.findById(req.user.id);
  
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }
  
  // Find address
  const address = user.addresses.id(addressId);
  
  if (!address) {
    return next(new ErrorResponse('Address not found', 404));
  }
  
  // Unset all default addresses
  user.addresses.forEach(addr => {
    addr.isDefault = false;
  });
  
  // Set this as default
  address.isDefault = true;
  
  await user.save();
  
  res.status(200).json({
    success: true,
    message: 'Default address updated',
    data: { address }
  });
});