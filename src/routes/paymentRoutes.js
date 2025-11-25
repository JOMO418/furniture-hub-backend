const express = require('express');
const router = express.Router();
const {
  initiatePayment,
  mpesaCallback,
  checkPaymentStatus
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validateRequest');

// STK Push validation
const validateSTKPush = [
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^(\+254|254|0)?[17]\d{8}$/).withMessage('Invalid Kenyan phone number'),
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ min: 1 }).withMessage('Amount must be at least 1 KES'),
  body('orderId')
    .notEmpty().withMessage('Order ID is required')
    .isMongoId().withMessage('Invalid order ID'),
  handleValidationErrors
];

// Protected routes
router.post('/mpesa/stk-push', protect, validateSTKPush, initiatePayment);
router.get('/mpesa/status/:checkoutRequestId', protect, checkPaymentStatus);

// Public route (called by Safaricom)
router.post('/mpesa/callback', mpesaCallback);

module.exports = router;
