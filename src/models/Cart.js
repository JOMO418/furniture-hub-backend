/**
 * ============================================
 * CART MODEL
 * ============================================
 * Shopping cart for logged-in users
 */

const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity cannot be less than 1'],
        default: 1
      },
      addedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  
  lastModified: {
    type: Date,
    default: Date.now
  }
  
}, {
  timestamps: true
});

// ==================
// INDEXES
// ==================

cartSchema.index({ user: 1 }, { unique: true });
cartSchema.index({ 'items.product': 1 });

// ==================
// VIRTUALS
// ==================

// Get total number of items
cartSchema.virtual('totalItems').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// ==================
// MIDDLEWARE
// ==================

// Update lastModified on any change
cartSchema.pre('save', function(next) {
  this.lastModified = Date.now();
  next();
});

// Remove duplicate products (keep latest)
cartSchema.pre('save', function(next) {
  const uniqueItems = [];
  const productIds = new Set();
  
  // Iterate from end to keep latest additions
  for (let i = this.items.length - 1; i >= 0; i--) {
    const productId = this.items[i].product.toString();
    if (!productIds.has(productId)) {
      uniqueItems.unshift(this.items[i]);
      productIds.add(productId);
    }
  }
  
  this.items = uniqueItems;
  next();
});

// ==================
// METHODS
// ==================

// Add item to cart
cartSchema.methods.addItem = async function(productId, quantity = 1) {
  const existingItem = this.items.find(
    item => item.product.toString() === productId.toString()
  );
  
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    this.items.push({
      product: productId,
      quantity,
      addedAt: new Date()
    });
  }
  
  await this.save();
  return this;
};

// Update item quantity
cartSchema.methods.updateItemQuantity = async function(productId, quantity) {
  const item = this.items.find(
    item => item.product.toString() === productId.toString()
  );
  
  if (!item) {
    throw new Error('Item not found in cart');
  }
  
  if (quantity <= 0) {
    return this.removeItem(productId);
  }
  
  item.quantity = quantity;
  await this.save();
  return this;
};

// Remove item from cart
cartSchema.methods.removeItem = async function(productId) {
  this.items = this.items.filter(
    item => item.product.toString() !== productId.toString()
  );
  
  await this.save();
  return this;
};

// Clear cart
cartSchema.methods.clearCart = async function() {
  this.items = [];
  await this.save();
  return this;
};

// Get cart with populated product details
cartSchema.methods.getCartWithDetails = async function() {
  await this.populate({
    path: 'items.product',
    select: 'name slug price salePrice images stock inStock'
  });
  
  return this;
};

// Calculate cart totals
cartSchema.methods.calculateTotals = async function() {
  await this.populate('items.product');
  
  let subtotal = 0;
  let totalItems = 0;
  
  for (const item of this.items) {
    if (item.product) {
      const price = item.product.salePrice || item.product.price;
      subtotal += price * item.quantity;
      totalItems += item.quantity;
    }
  }
  
  return {
    subtotal,
    totalItems,
    items: this.items.length
  };
};

// Validate cart items (check stock availability)
cartSchema.methods.validateCart = async function() {
  await this.populate('items.product');
  
  const invalidItems = [];
  const validItems = [];
  
  for (const item of this.items) {
    if (!item.product) {
      invalidItems.push({
        reason: 'Product no longer exists',
        item
      });
    } else if (item.product.stock < item.quantity) {
      invalidItems.push({
        reason: `Only ${item.product.stock} items available`,
        item,
        availableStock: item.product.stock
      });
    } else if (item.product.stock === 0) {
      invalidItems.push({
        reason: 'Out of stock',
        item
      });
    } else {
      validItems.push(item);
    }
  }
  
  return {
    isValid: invalidItems.length === 0,
    invalidItems,
    validItems
  };
};

// ==================
// STATICS
// ==================

// Get or create cart for user
cartSchema.statics.getOrCreate = async function(userId) {
  let cart = await this.findOne({ user: userId });
  
  if (!cart) {
    cart = await this.create({ user: userId, items: [] });
  }
  
  return cart;
};

// Clean up old empty carts (older than 30 days)
cartSchema.statics.cleanupOldCarts = async function() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  return this.deleteMany({
    items: { $size: 0 },
    lastModified: { $lt: thirtyDaysAgo }
  });
};

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;