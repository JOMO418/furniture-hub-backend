/**
 * ============================================
 * AUTHENTICATION MIDDLEWARE (FIXED)
 * ============================================
 * Verifies JWT tokens and protects routes
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ErrorResponse } = require('./errorHandler');

/**
 * Protect routes - Verify JWT token
 * Adds standardized user object to req.user
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      // Extract token from "Bearer TOKEN"
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Not authorized to access this route. Please login.',
          statusCode: 401
        }
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token (exclude password)
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'User no longer exists',
            statusCode: 401
          }
        });
      }

      // STANDARDIZED: Attach user to request
      // Always use req.user.id in controllers (not req.user._id)
      const userObject = user.toObject();
      req.user = {
        id: user._id.toString(),    // ✅ Primary - use this everywhere
        _id: user._id,              // For Mongoose operations
        fullName: userObject.fullName,
        email: userObject.email,
        phone: userObject.phone,
        role: userObject.role,
        address: userObject.address,
        ...userObject
      };

      next();

    } catch (error) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Not authorized, token failed',
          statusCode: 401
        }
      });
    }

  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Server error in authentication',
        statusCode: 500
      }
    });
  }
};

module.exports = { protect };