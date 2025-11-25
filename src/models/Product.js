const mongoose = require('mongoose');
const slugify = require('slugify');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide product name'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  
  description: {
    type: String,
    required: [true, 'Please provide product description'],
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  
  price: {
    type: Number,
    required: [true, 'Please provide product price'],
    min: [0, 'Price cannot be negative']
  },
  
  salePrice: {
    type: Number,
    min: [0, 'Sale price cannot be negative'],
    validate: {
      validator: function(value) {
        return !value || value < this.price;
      },
      message: 'Sale price must be less than regular price'
    }
  },
  
  category: {
    type: String,
    required: [true, 'Please specify product category'],
    enum: {
      values: ['living-room', 'bedroom', 'dining', 'office', 'outdoor', 'storage', 'lighting', 'decor'],
      message: 'Invalid category'
    },
    index: true
  },
  
  subcategory: {
    type: String,
    trim: true
  },
  
  images: [
    {
      url: {
        type: String,
        required: true
      },
      publicId: {
        type: String,
        required: true
      },
      alt: {
        type: String,
        default: ''
      }
    }
  ],
  
  specifications: {
    dimensions: {
      type: String,
      trim: true
    },
    material: {
      type: String,
      trim: true
    },
    color: {
      type: String,
      trim: true
    },
    weight: {
      type: String,
      trim: true
    },
    assembly: {
      type: String,
      trim: true,
      enum: ['Required', 'Not Required', 'Partially Required', '']
    }
  },
  
  tags: [
    {
      type: String,
      lowercase: true,
      trim: true
    }
  ],
  
  stock: {
    type: Number,
    required: [true, 'Please specify stock quantity'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  
  featured: {
    type: Boolean,
    default: false,
    index: true
  },
  
  bestSeller: {
    type: Boolean,
    default: false,
    index: true
  },
  
  newArrival: {
    type: Boolean,
    default: false,
    index: true
  },
  
  averageRating: {
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be less than 0'],
    max: [5, 'Rating cannot be more than 5']
  },
  
  numReviews: {
    type: Number,
    default: 0,
    min: [0, 'Number of reviews cannot be negative']
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ==================
// INDEXES
// ==================

// Text index for search functionality
productSchema.index({ name: 'text', tags: 'text', description: 'text' });

// Compound indexes for common queries
productSchema.index({ category: 1, featured: 1 });
productSchema.index({ category: 1, bestSeller: 1 });
productSchema.index({ category: 1, newArrival: 1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });

// ==================
// VIRTUALS
// ==================

// Check if product is on sale
productSchema.virtual('isOnSale').get(function() {
  return this.salePrice && this.salePrice < this.price;
});

// Calculate discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (!this.salePrice || this.salePrice >= this.price) return 0;
  return Math.round(((this.price - this.salePrice) / this.price) * 100);
});

// Check if in stock
productSchema.virtual('inStock').get(function() {
  return this.stock > 0;
});

// Get final price (sale price if available, otherwise regular price)
productSchema.virtual('finalPrice').get(function() {
  return this.salePrice && this.salePrice < this.price ? this.salePrice : this.price;
});

// ==================
// MIDDLEWARE
// ==================

// Generate slug before saving
productSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { 
      lower: true, 
      strict: true,
      remove: /[*+~.()'"!:@]/g
    });
  }
  next();
});

// Ensure slug uniqueness
productSchema.pre('save', async function(next) {
  if (!this.isModified('name')) return next();
  
  let slug = this.slug;
  let count = 1;
  
  // Check if slug exists
  while (await mongoose.models.Product.findOne({ slug, _id: { $ne: this._id } })) {
    slug = `${this.slug}-${count}`;
    count++;
  }
  
  this.slug = slug;
  next();
});

// Update timestamps for image changes
productSchema.pre('save', function(next) {
  if (this.isModified('images')) {
    this.updatedAt = Date.now();
  }
  next();
});

// ==================
// METHODS
// ==================

// Update stock after purchase
productSchema.methods.updateStock = async function(quantity) {
  this.stock -= quantity;
  if (this.stock < 0) this.stock = 0;
  await this.save();
};

// Add review and update rating
productSchema.methods.addReview = async function(rating) {
  this.numReviews += 1;
  this.averageRating = ((this.averageRating * (this.numReviews - 1)) + rating) / this.numReviews;
  await this.save();
};

// ==================
// STATICS
// ==================

// Get featured products
productSchema.statics.getFeatured = function(limit = 8) {
  return this.find({ featured: true, stock: { $gt: 0 } })
    .sort('-createdAt')
    .limit(limit);
};

// Get best sellers
productSchema.statics.getBestSellers = function(limit = 8) {
  return this.find({ bestSeller: true, stock: { $gt: 0 } })
    .sort('-averageRating -numReviews')
    .limit(limit);
};

// Get new arrivals
productSchema.statics.getNewArrivals = function(limit = 8) {
  return this.find({ newArrival: true, stock: { $gt: 0 } })
    .sort('-createdAt')
    .limit(limit);
};

// Search products
productSchema.statics.search = function(query, options = {}) {
  const searchQuery = {
    $text: { $search: query },
    stock: { $gt: 0 }
  };
  
  return this.find(searchQuery, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } })
    .limit(options.limit || 20);
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product;