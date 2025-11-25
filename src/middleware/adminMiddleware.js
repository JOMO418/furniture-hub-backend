/**
 * ============================================
 * ADMIN AUTHORIZATION MIDDLEWARE
 * ============================================
 * Checks if user has admin role
 * Must be used AFTER protect middleware
 */

/**
 * Authorize admin only
 * Checks if authenticated user has admin role
 */
const authorizeAdmin = (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Not authenticated',
          statusCode: 401
        }
      });
    }
  
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Access denied. Admin privileges required.',
          statusCode: 403
        }
      });
    }
  
    next();
  };
  
  module.exports = { authorizeAdmin };