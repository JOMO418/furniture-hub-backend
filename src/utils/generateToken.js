/**
 * ============================================
 * JWT TOKEN GENERATION
 * ============================================
 * Creates and signs JWT tokens for authentication
 */

const jwt = require('jsonwebtoken');

/**
 * Generate JWT token for user
 * @param {string} userId - User ID from database
 * @param {string} email - User email
 * @param {string} role - User role (customer/admin)
 * @returns {string} JWT token
 */
const generateToken = (userId, email, role) => {
  const payload = {
    id: userId,
    email: email,
    role: role
  };
  
  const token = jwt.sign(
    payload,
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    }
  );
  
  return token;
};

/**
 * Generate refresh token (for future use)
 * @param {string} userId - User ID from database
 * @returns {string} Refresh token
 */
const generateRefreshToken = (userId) => {
  const token = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    {
      expiresIn: '30d'
    }
  );
  
  return token;
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {object} Decoded token payload
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken
};