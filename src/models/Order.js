/**
 * ============================================
 * ORDER MODEL
 * ============================================
 * Complete order management with status tracking
 */

const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  customer: {
    fullName: {
      type: String,
      required: [true, 'Customer name is required']
    },
    email: {
      type: String,
      required: [true, 'Customer email is required'],
      lowercase: true
    },
    phone: {
      type: String,
      required: [true, 'Customer phone is required']
    },
    address: {
      type: String,
      required: [true, 'Delivery address is required']
    },
    city: {
      type: String,
      required: [true, 'City is required']
    },
    county: {
      type: String
    }
  },
  
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      name: {
        type: String,
        required: true
      },
      price: {
        type: Number,
        required: true,
        min: 0
      },
      quantity: {
        type: Number,
        required: true,
        min: 1
      },
      image: {
        type: String,
        default: ''
      }
    }
  ],
  
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  
  deliveryFee: {
    type: Number,
    default: 0,
    min: 0
  },
  
  total: {
    type: Number,
    required: true,
    min: 0
  },
  
  paymentMethod: {
    type: String,
    required: true,
    enum: ['mpesa', 'card', 'cod'],
    default: 'mpesa'
  },
  
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
    index: true
  },
  
  paymentDetails: {
    mpesaReceiptNumber: String,
    transactionId: String,
    phoneNumber: String,
    paidAt: Date
  },
  
  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
    index: true
  },
  
  statusHistory: [
    {
      status: {
        type: String,
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      note: String,
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }
  ],
  
  deliveryDate: {
    type: Date
  },
  
  notes: {
    type: String,
    maxlength: 1000
  },
  
  cancelReason: {
    type: String
  },
  
  refundAmount: {
    type: Number,
    min: 0
  }
  
}, {
  timestamps: true
});

// ==================
// INDEXES
// ==================

orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'paymentDetails.mpesaReceiptNumber': 1 });

// ==================
// VIRTUALS
// ==================

// Check if order is completed
orderSchema.virtual('isCompleted').get(function() {
  return this.orderStatus === 'delivered';
});

// Check if order can be cancelled
orderSchema.virtual('canBeCancelled').get(function() {
  return ['pending', 'confirmed'].includes(this.orderStatus);
});

// ==================
// MIDDLEWARE
// ==================

// Generate order number before saving
orderSchema.pre('save', async function(next) {
  if (this.isNew) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // Get count of orders today
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const count = await mongoose.model('Order').countDocuments({
      createdAt: { $gte: startOfDay }
    });
    
    // Generate order number: ORD-YYYYMMDD-XXXX
    this.orderNumber = `ORD-${year}${month}${day}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Add initial status to history
orderSchema.pre('save', function(next) {
  if (this.isNew) {
    this.statusHistory.push({
      status: this.orderStatus,
      timestamp: new Date(),
      note: 'Order created'
    });
  }
  next();
});

// ==================
// METHODS
// ==================

// Update order status
orderSchema.methods.updateStatus = async function(newStatus, note, updatedBy) {
  this.orderStatus = newStatus;
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    note: note || `Status changed to ${newStatus}`,
    updatedBy
  });
  await this.save();
};

// Mark as paid
orderSchema.methods.markAsPaid = async function(paymentDetails) {
  this.paymentStatus = 'paid';
  this.paymentDetails = {
    ...this.paymentDetails,
    ...paymentDetails,
    paidAt: new Date()
  };
  
  // Auto-confirm order when paid
  if (this.orderStatus === 'pending') {
    await this.updateStatus('confirmed', 'Payment received and order confirmed');
  } else {
    await this.save();
  }
};

// Cancel order
orderSchema.methods.cancelOrder = async function(reason, cancelledBy) {
  if (!this.canBeCancelled) {
    throw new Error('Order cannot be cancelled at this stage');
  }
  
  this.orderStatus = 'cancelled';
  this.cancelReason = reason;
  this.statusHistory.push({
    status: 'cancelled',
    timestamp: new Date(),
    note: reason,
    updatedBy: cancelledBy
  });
  
  await this.save();
};

// Calculate delivery estimate (3-5 business days)
orderSchema.methods.getDeliveryEstimate = function() {
  const orderDate = this.createdAt;
  const minDays = 3;
  const maxDays = 5;
  
  const minDelivery = new Date(orderDate);
  minDelivery.setDate(minDelivery.getDate() + minDays);
  
  const maxDelivery = new Date(orderDate);
  maxDelivery.setDate(maxDelivery.getDate() + maxDays);
  
  return {
    min: minDelivery,
    max: maxDelivery
  };
};

// ==================
// STATICS
// ==================

// Get user's orders
orderSchema.statics.getUserOrders = function(userId, options = {}) {
  const query = this.find({ user: userId })
    .populate('items.product', 'name slug images')
    .sort('-createdAt');
  
  if (options.limit) query.limit(options.limit);
  
  return query;
};

// Get orders by status
orderSchema.statics.getByStatus = function(status, limit = 50) {
  return this.find({ orderStatus: status })
    .populate('user', 'fullName email phone')
    .populate('items.product', 'name slug')
    .sort('-createdAt')
    .limit(limit);
};

// Get sales statistics
orderSchema.statics.getSalesStats = async function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        paymentStatus: 'paid'
      }
    },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$total' },
        averageOrderValue: { $avg: '$total' }
      }
    }
  ]);
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;