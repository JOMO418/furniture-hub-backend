/**
 * ============================================
 * REVIEW MODEL (Future Feature)
 * ============================================
 * Product reviews and ratings
 */

const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  rating: {
    type: Number,
    required: [true, 'Please provide a rating'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot be more than 5']
  },
  
  comment: {
    type: String,
    required: [true, 'Please provide a review comment'],
    trim: true,
    maxlength: [1000, 'Review cannot exceed 1000 characters']
  },
  
  images: [
    {
      type: String
    }
  ],
  
  isVerifiedPurchase: {
    type: Boolean,
    default: false
  },
  
  helpfulCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  isApproved: {
    type: Boolean,
    default: true // Set to false if you want to moderate reviews
  }
  
}, {
  timestamps: true
});

// ==================
// INDEXES
// ==================

// Compound index: one review per user per product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });
reviewSchema.index({ product: 1, createdAt: -1 });
reviewSchema.index({ isApproved: 1 });

// ==================
// MIDDLEWARE
// ==================

// Update product rating after review is saved
reviewSchema.post('save', async function() {
  await this.constructor.updateProductRating(this.product);
});

// Update product rating after review is removed
reviewSchema.post('remove', async function() {
  await this.constructor.updateProductRating(this.product);
});

// ==================
// STATICS
// ==================

// Update product's average rating
reviewSchema.statics.updateProductRating = async function(productId) {
  const result = await this.aggregate([
    {
      $match: { 
        product: productId,
        isApproved: true
      }
    },
    {
      $group: {
        _id: '$product',
        averageRating: { $avg: '$rating' },
        numReviews: { $sum: 1 }
      }
    }
  ]);
  
  const Product = mongoose.model('Product');
  
  if (result.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      averageRating: Math.round(result[0].averageRating * 10) / 10,
      numReviews: result[0].numReviews
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      averageRating: 0,
      numReviews: 0
    });
  }
};

// Get product reviews
reviewSchema.statics.getProductReviews = function(productId, options = {}) {
  const query = this.find({ 
    product: productId,
    isApproved: true
  })
  .populate('user', 'fullName')
  .sort('-createdAt');
  
  if (options.limit) query.limit(options.limit);
  
  return query;
};

// Get user's reviews
reviewSchema.statics.getUserReviews = function(userId) {
  return this.find({ user: userId })
    .populate('product', 'name slug images')
    .sort('-createdAt');
};

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;