/**
 * ============================================
 * PAYMENT CONTROLLER
 * ============================================
 * M-Pesa STK Push integration
 */

const Order = require('../models/Order');
const { ErrorResponse, asyncHandler } = require('../middleware/errorHandler');
const {
  initiateSTKPush,
  querySTKPushStatus,
  processCallback
} = require('../services/mpesaService');

/**
 * @desc    Initiate M-Pesa STK Push
 * @route   POST /api/payment/mpesa/stk-push
 * @access  Private
 */
exports.initiatePayment = asyncHandler(async (req, res, next) => {
  const { phone, amount, orderId } = req.body;

  // Validate inputs
  if (!phone || !amount || !orderId) {
    return next(new ErrorResponse('Phone, amount, and order ID are required', 400));
  }

  // Get order
  const order = await Order.findById(orderId);

  if (!order) {
    return next(new ErrorResponse('Order not found', 404));
  }

  // Check if user owns the order
  if (order.user.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized', 403));
  }

  // Check if order is already paid
  if (order.paymentStatus === 'paid') {
    return next(new ErrorResponse('Order is already paid', 400));
  }

  // Validate amount matches order total
  if (Math.abs(amount - order.total) > 1) {
    return next(new ErrorResponse('Payment amount does not match order total', 400));
  }

  try {
    // Initiate STK Push
    const result = await initiateSTKPush(
      phone,
      amount,
      order.orderNumber,
      `Payment for order ${order.orderNumber}`
    );

    // Update order with payment details
    order.paymentDetails = {
      ...order.paymentDetails,
      phoneNumber: phone,
      transactionId: result.checkoutRequestId
    };
    await order.save();

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        checkoutRequestId: result.checkoutRequestId,
        merchantRequestId: result.merchantRequestId
      }
    });

  } catch (error) {
    return next(error);
  }
});

/**
 * @desc    M-Pesa payment callback
 * @route   POST /api/payment/mpesa/callback
 * @access  Public (called by Safaricom)
 */
exports.mpesaCallback = asyncHandler(async (req, res, next) => {
  try {
    // Process callback data
    const result = processCallback(req.body);

    // Find order by transaction ID
    const order = await Order.findOne({
      'paymentDetails.transactionId': result.checkoutRequestId
    });

    if (!order) {
      console.error('Order not found for callback:', result.checkoutRequestId);
      return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    if (result.success) {
      // Payment successful
      await order.markAsPaid({
        mpesaReceiptNumber: result.mpesaReceiptNumber,
        transactionId: result.checkoutRequestId,
        phoneNumber: result.phoneNumber
      });

      console.log(`✅ Payment successful for order ${order.orderNumber}`);
    } else {
      // Payment failed
      order.paymentStatus = 'failed';
      order.paymentDetails.failureReason = result.resultDesc;
      await order.save();

      console.log(`❌ Payment failed for order ${order.orderNumber}: ${result.resultDesc}`);
    }

    // Always return success to Safaricom
    res.status(200).json({
      ResultCode: 0,
      ResultDesc: 'Accepted'
    });

  } catch (error) {
    console.error('M-Pesa Callback Error:', error);
    
    // Still return success to Safaricom
    res.status(200).json({
      ResultCode: 0,
      ResultDesc: 'Accepted'
    });
  }
});

/**
 * @desc    Check payment status
 * @route   GET /api/payment/mpesa/status/:checkoutRequestId
 * @access  Private
 */
exports.checkPaymentStatus = asyncHandler(async (req, res, next) => {
  const { checkoutRequestId } = req.params;

  if (!checkoutRequestId) {
    return next(new ErrorResponse('Checkout Request ID is required', 400));
  }

  // Find order
  const order = await Order.findOne({
    'paymentDetails.transactionId': checkoutRequestId
  });

  if (!order) {
    return next(new ErrorResponse('Order not found', 404));
  }

  // Check if user owns the order
  if (order.user.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized', 403));
  }

  // If already paid, return status
  if (order.paymentStatus === 'paid') {
    return res.status(200).json({
      success: true,
      data: {
        status: 'paid',
        mpesaReceiptNumber: order.paymentDetails.mpesaReceiptNumber,
        paidAt: order.paymentDetails.paidAt
      }
    });
  }

  // Query M-Pesa API for status
  try {
    const result = await querySTKPushStatus(checkoutRequestId);

    res.status(200).json({
      success: true,
      data: {
        status: result.status,
        resultCode: result.resultCode,
        resultDesc: result.resultDesc
      }
    });

  } catch (error) {
    return next(error);
  }
});