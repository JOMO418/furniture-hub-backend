const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');
const { body } = require('express-validator');
const { handleValidationErrors, validateObjectId } = require('../middleware/validateRequest');

// All cart routes require authentication
router.use(protect);

// Cart validation
const validateAddToCart = [
  body('productId')
    .notEmpty().withMessage('Product ID is required')
    .isMongoId().withMessage('Invalid product ID'),
  body('quantity')
    .optional()
    .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  handleValidationErrors
];

const validateUpdateCart = [
  body('quantity')
    .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  handleValidationErrors
];

// Routes
router.get('/', getCart);
router.post('/', validateAddToCart, addToCart);
router.put('/:itemId', validateObjectId, validateUpdateCart, updateCartItem);
router.delete('/:itemId', validateObjectId, removeFromCart);
router.delete('/', clearCart);

module.exports = router;