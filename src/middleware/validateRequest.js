/**
 * ============================================
 * REQUEST VALIDATION MIDDLEWARE
 * ============================================
 * Validates request data using express-validator
 */

const { body, param, query, validationResult } = require('express-validator');

/**
 * Validation result handler
 * Checks for validation errors and returns formatted response
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        statusCode: 400,
        details: errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }))
      }
    });
  }
  
  next();
};

// ==================
// USER VALIDATION
// ==================

const validateRegister = [
  body('fullName')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Full name must be 2-100 characters'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^(\+254|254|0)?[17]\d{8}$/).withMessage('Please provide a valid Kenyan phone number'),
  
  handleValidationErrors
];

const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required'),
  
  handleValidationErrors
];

const validateUpdateProfile = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Full name must be 2-100 characters'),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^(\+254|254|0)?[17]\d{8}$/).withMessage('Please provide a valid Kenyan phone number'),
  
  body('address.street')
    .optional()
    .trim(),
  
  body('address.city')
    .optional()
    .trim(),
  
  body('address.county')
    .optional()
    .trim(),
  
  handleValidationErrors
];

const validateChangePassword = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),
  
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password must be different from current password');
      }
      return true;
    }),
  
  handleValidationErrors
];

// ==================
// PRODUCT VALIDATION
// ==================

const validateProduct = [
  body('name')
    .trim()
    .notEmpty().withMessage('Product name is required')
    .isLength({ min: 3, max: 200 }).withMessage('Product name must be 3-200 characters'),
  
  body('description')
    .trim()
    .notEmpty().withMessage('Product description is required')
    .isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  
  body('price')
    .notEmpty().withMessage('Price is required')
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  
  body('salePrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Sale price must be a positive number'),
  
  body('category')
    .trim()
    .notEmpty().withMessage('Category is required'),
  
  body('stock')
    .optional()
    .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  
  handleValidationErrors
];

// ==================
// OBJECT ID VALIDATION
// ==================

const validateObjectId = [
  param('id')
    .isMongoId().withMessage('Invalid ID format'),
  
  handleValidationErrors
];

// ==================
// ORDER VALIDATION
// ==================

const validateOrder = [
  body('items')
    .isArray({ min: 1 }).withMessage('Order must contain at least one item'),
  
  body('items.*.product')
    .notEmpty().withMessage('Product ID is required'),
  
  body('items.*.quantity')
    .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  
  body('customer.fullName')
    .trim()
    .notEmpty().withMessage('Customer full name is required'),
  
  body('customer.email')
    .trim()
    .notEmpty().withMessage('Customer email is required')
    .isEmail().withMessage('Please provide a valid email'),
  
  body('customer.phone')
    .trim()
    .notEmpty().withMessage('Customer phone is required')
    .matches(/^(\+254|254|0)?[17]\d{8}$/).withMessage('Please provide a valid Kenyan phone number'),
  
  body('customer.address')
    .trim()
    .notEmpty().withMessage('Delivery address is required'),
  
  body('customer.city')
    .trim()
    .notEmpty().withMessage('City is required'),
  
  body('paymentMethod')
    .notEmpty().withMessage('Payment method is required')
    .isIn(['mpesa', 'card', 'cod']).withMessage('Invalid payment method'),
  
  handleValidationErrors
];

// ==================
// PAYMENT VALIDATION
// ==================

const validateSTKPush = [
  body('phoneNumber')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^(\+254|254|0)?[17]\d{8}$/).withMessage('Please provide a valid Kenyan phone number'),
  
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ min: 1 }).withMessage('Amount must be at least 1 KES'),
  
  body('orderNumber')
    .trim()
    .notEmpty().withMessage('Order number is required'),
  
  handleValidationErrors
];

// ==================
// CATEGORY VALIDATION
// ==================

const validateCategory = [
  body('name')
    .trim()
    .notEmpty().withMessage('Category name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Category name must be 2-50 characters'),
  
  body('description')
    .optional()
    .trim(),
  
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateChangePassword,
  validateProduct,
  validateObjectId,  // ✅ ADDED THIS
  validateOrder,
  validateSTKPush,
  validateCategory
};