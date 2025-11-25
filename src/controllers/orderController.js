/**
 * ============================================
 * ORDER CONTROLLER
 * ============================================
 */

const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const { ErrorResponse, asyncHandler } = require('../middleware/errorHandler');
const { sendOrderConfirmationEmail } = require('../utils/emailService');
const { calculateDeliveryFee } = require('../utils/helpers');

/**
 * @desc    Create new order
 * @route   POST /api/orders
 * @access  Private
 */
exports.createOrder = asyncHandler(async (req, res, next) => {
  const {
    customer,
    items,
    paymentMethod = 'mpesa',
    notes
  } = req.body;

  // Validate items
  if (!items || items.length === 0) {
    return next(new ErrorResponse('Order must contain at least one item', 400));
  }

  // Validate and prepare order items
  const orderItems = [];
  let subtotal = 0;

  for (const item of items) {
    const product = await Product.findById(item.product);

    if (!product) {
      return next(new ErrorResponse(`Product ${item.product} not found`, 404));
    }

    if (product.stock < item.quantity) {
      return next(new ErrorResponse(`Insufficient stock for ${product.name}`, 400));
    }

    const price = product.salePrice || product.price;
    const itemSubtotal = price * item.quantity;

    orderItems.push({
      product: product._id,
      name: product.name,
      price: price,
      quantity: item.quantity,
      image: product.images[0]?.url || ''
    });

    subtotal += itemSubtotal;

    // Update product stock
    await product.updateStock(item.quantity);
  }

  // Calculate delivery fee
  const deliveryFee = calculateDeliveryFee(customer.city);
  const total = subtotal + deliveryFee;

  // Create order
  const order = await Order.create({
    user: req.user.id,
    customer,
    items: orderItems,
    subtotal,
    deliveryFee,
    total,
    paymentMethod,
    notes
  });

  // Clear user's cart
  await Cart.findOneAndUpdate(
    { user: req.user.id },
    { items: [] }
  );

  // Send confirmation email
  await sendOrderConfirmationEmail(order);

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: { order }
  });
});

/**
 * @desc    Get user's orders
 * @route   GET /api/orders/my-orders
 * @access  Private
 */
exports.getMyOrders = asyncHandler(async (req, res, next) => {
  const orders = await Order.getUserOrders(req.user.id, { limit: 50 });

  res.status(200).json({
    success: true,
    data: { orders }
  });
});

/**
 * @desc    Get order by ID
 * @route   GET /api/orders/:id
 * @access  Private
 */
exports.getOrderById = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'fullName email phone')
    .populate('items.product', 'name slug images');

  if (!order) {
    return next(new ErrorResponse('Order not found', 404));
  }

  // Check if user owns the order or is admin
  if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to access this order', 403));
  }

  res.status(200).json({
    success: true,
    data: { order }
  });
});

/**
 * @desc    Get all orders (Admin)
 * @route   GET /api/orders
 * @access  Admin
 */
exports.getAllOrders = asyncHandler(async (req, res, next) => {
  const { status, page = 1, limit = 50 } = req.query;

  const query = {};
  if (status) query.orderStatus = status;

  const orders = await Order.find(query)
    .populate('user', 'fullName email phone')
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Order.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

/**
 * @desc    Update order status (Admin)
 * @route   PUT /api/orders/:id/status
 * @access  Admin
 */
exports.updateOrderStatus = asyncHandler(async (req, res, next) => {
  const { status, note } = req.body;

  if (!status) {
    return next(new ErrorResponse('Status is required', 400));
  }

  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorResponse('Order not found', 404));
  }

  await order.updateStatus(status, note, req.user.id);

  res.status(200).json({
    success: true,
    message: 'Order status updated',
    data: { order }
  });
});

/**
 * @desc    Cancel order
 * @route   DELETE /api/orders/:id
 * @access  Private
 */
exports.cancelOrder = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorResponse('Order not found', 404));
  }

  // Check if user owns the order
  if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to cancel this order', 403));
  }

  try {
    await order.cancelOrder(reason || 'Cancelled by customer', req.user.id);

    // Restore product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: { order }
    });
  } catch (error) {
    return next(new ErrorResponse(error.message, 400));
  }
});