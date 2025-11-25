/**
 * ============================================
 * CART CONTROLLER
 * ============================================
 */

const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { ErrorResponse, asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Get user's cart
 * @route   GET /api/cart
 * @access  Private
 */
exports.getCart = asyncHandler(async (req, res, next) => {
  let cart = await Cart.findOne({ user: req.user.id })
    .populate({
      path: 'items.product',
      select: 'name slug price salePrice images stock'
    });

  if (!cart) {
    cart = await Cart.create({ user: req.user.id, items: [] });
  }

  // Calculate totals
  const totals = await cart.calculateTotals();

  res.status(200).json({
    success: true,
    data: {
      cart,
      totals
    }
  });
});

/**
 * @desc    Add item to cart
 * @route   POST /api/cart
 * @access  Private
 */
exports.addToCart = asyncHandler(async (req, res, next) => {
  const { productId, quantity = 1 } = req.body;

  if (!productId) {
    return next(new ErrorResponse('Product ID is required', 400));
  }

  // Check if product exists and is in stock
  const product = await Product.findById(productId);

  if (!product) {
    return next(new ErrorResponse('Product not found', 404));
  }

  if (product.stock < quantity) {
    return next(new ErrorResponse(`Only ${product.stock} items available in stock`, 400));
  }

  // Get or create cart
  let cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    cart = await Cart.create({ user: req.user.id, items: [] });
  }

  // Add item to cart
  await cart.addItem(productId, quantity);

  // Populate and return
  await cart.populate({
    path: 'items.product',
    select: 'name slug price salePrice images stock'
  });

  const totals = await cart.calculateTotals();

  res.status(200).json({
    success: true,
    message: 'Item added to cart',
    data: {
      cart,
      totals
    }
  });
});

/**
 * @desc    Update cart item quantity
 * @route   PUT /api/cart/:itemId
 * @access  Private
 */
exports.updateCartItem = asyncHandler(async (req, res, next) => {
  const { quantity } = req.body;
  const { itemId } = req.params;

  if (!quantity || quantity < 1) {
    return next(new ErrorResponse('Valid quantity is required', 400));
  }

  const cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    return next(new ErrorResponse('Cart not found', 404));
  }

  // Find item in cart
  const item = cart.items.find(item => item._id.toString() === itemId);

  if (!item) {
    return next(new ErrorResponse('Item not found in cart', 404));
  }

  // Check stock availability
  const product = await Product.findById(item.product);

  if (!product) {
    return next(new ErrorResponse('Product no longer available', 404));
  }

  if (product.stock < quantity) {
    return next(new ErrorResponse(`Only ${product.stock} items available`, 400));
  }

  // Update quantity
  item.quantity = quantity;
  await cart.save();

  // Populate and return
  await cart.populate({
    path: 'items.product',
    select: 'name slug price salePrice images stock'
  });

  const totals = await cart.calculateTotals();

  res.status(200).json({
    success: true,
    message: 'Cart updated',
    data: {
      cart,
      totals
    }
  });
});

/**
 * @desc    Remove item from cart
 * @route   DELETE /api/cart/:itemId
 * @access  Private
 */
exports.removeFromCart = asyncHandler(async (req, res, next) => {
  const { itemId } = req.params;

  const cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    return next(new ErrorResponse('Cart not found', 404));
  }

  // Find item index
  const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);

  if (itemIndex === -1) {
    return next(new ErrorResponse('Item not found in cart', 404));
  }

  // Remove item
  cart.items.splice(itemIndex, 1);
  await cart.save();

  // Populate and return
  await cart.populate({
    path: 'items.product',
    select: 'name slug price salePrice images stock'
  });

  const totals = await cart.calculateTotals();

  res.status(200).json({
    success: true,
    message: 'Item removed from cart',
    data: {
      cart,
      totals
    }
  });
});

/**
 * @desc    Clear cart
 * @route   DELETE /api/cart
 * @access  Private
 */
exports.clearCart = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    return next(new ErrorResponse('Cart not found', 404));
  }

  await cart.clearCart();

  res.status(200).json({
    success: true,
    message: 'Cart cleared',
    data: {
      cart,
      totals: {
        subtotal: 0,
        totalItems: 0,
        items: 0
      }
    }
  });
});