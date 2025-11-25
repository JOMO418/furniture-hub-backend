/**
 * ============================================
 * CATEGORY MODEL
 * ============================================
 * Product categories with metadata
 */

const mongoose = require('mongoose');
const slugify = require('slugify');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide category name'],
    unique: true,
    trim: true,
    maxlength: [100, 'Category name cannot exceed 100 characters']
  },
  
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  image: {
    url: {
      type: String,
      default: ''
    },
    publicId: {
      type: String,
      default: ''
    }
  },
  
  productCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
  
}, {
  timestamps: true
});

// ==================
// INDEXES
// ==================

categorySchema.index({ slug: 1 });
categorySchema.index({ isActive: 1 });

// ==================
// MIDDLEWARE
// ==================

// Generate slug before saving
categorySchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { 
      lower: true, 
      strict: true,
      remove: /[*+~.()'"!:@]/g
    });
  }
  next();
});

// ==================
// METHODS
// ==================

// Update product count
categorySchema.methods.updateProductCount = async function() {
  const Product = mongoose.model('Product');
  this.productCount = await Product.countDocuments({ category: this.slug });
  await this.save();
};

// ==================
// STATICS
// ==================

// Get active categories
categorySchema.statics.getActive = function() {
  return this.find({ isActive: true }).sort('name');
};

// Get categories with product counts
categorySchema.statics.getWithCounts = async function() {
  return this.aggregate([
    {
      $lookup: {
        from: 'products',
        localField: 'slug',
        foreignField: 'category',
        as: 'products'
      }
    },
    {
      $addFields: {
        productCount: { $size: '$products' }
      }
    },
    {
      $project: {
        products: 0
      }
    },
    {
      $sort: { name: 1 }
    }
  ]);
};

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;