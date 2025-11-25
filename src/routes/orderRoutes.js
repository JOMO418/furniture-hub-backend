const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  cancelOrder
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeAdmin } = require('../middleware/adminMiddleware');
const {
  validateOrder,
  validateObjectId
} = require('../middleware/validateRequest');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validateRequest');

// Protected routes (require login)
router.post('/', protect, validateOrder, createOrder);
router.get('/my-orders', protect, getMyOrders);
router.get('/:id', protect, validateObjectId, getOrderById);

// Cancel order validation
const validateCancelOrder = [
  body('reason').optional().trim(),
  handleValidationErrors
];
router.delete('/:id', protect, validateObjectId, validateCancelOrder, cancelOrder);

// Admin routes
router.get('/', protect, authorizeAdmin, getAllOrders);

// Update status validation
const validateOrderStatus = [
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid status'),
  body('note').optional().trim(),
  handleValidationErrors
];
router.put('/:id/status', protect, authorizeAdmin, validateObjectId, validateOrderStatus, updateOrderStatus);

module.exports = router;