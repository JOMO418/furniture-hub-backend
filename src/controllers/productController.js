/**
 * ============================================
 * PRODUCT CONTROLLER
 * ============================================
 * Complete product CRUD and filtering
 */

const Product = require('../models/Product');
const { ErrorResponse, asyncHandler } = require('../middleware/errorHandler');
const { uploadImage, deleteImage } = require('../services/cloudinaryService');
const { getPaginationData } = require('../utils/helpers');

/**
 * @desc    Get all products with filtering, sorting, pagination
 * @route   GET /api/products
 * @access  Public
 */
exports.getAllProducts = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 12,
    category,
    minPrice,
    maxPrice,
    material,
    color,
    tags,
    sort = '-createdAt',
    search,
    featured,
    bestSeller,
    newArrival
  } = req.query;

  // Build query
  const query = { stock: { $gt: 0 } }; // Only in-stock items

  // Category filter
  if (category) query.category = category;

  // Price range filter
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  // Specifications filters
  if (material) query['specifications.material'] = new RegExp(material, 'i');
  if (color) query['specifications.color'] = new RegExp(color, 'i');

  // Tags filter (array)
  if (tags) {
    const tagsArray = tags.split(',');
    query.tags = { $in: tagsArray };
  }

  // Feature flags
  if (featured === 'true') query.featured = true;
  if (bestSeller === 'true') query.bestSeller = true;
  if (newArrival === 'true') query.newArrival = true;

  // Text search
  if (search) {
    query.$text = { $search: search };
  }

  // Count total documents
  const totalDocuments = await Product.countDocuments(query);

  // Pagination
  const pagination = getPaginationData(page, limit, totalDocuments);

  // Sort mapping
  const sortMap = {
    'price-asc': { price: 1 },
    'price-desc': { price: -1 },
    'newest': { createdAt: -1 },
    'popular': { averageRating: -1, numReviews: -1 }
  };
  const sortOption = sortMap[sort] || { createdAt: -1 };

  // Execute query
  const products = await Product.find(query)
    .sort(sortOption)
    .skip(pagination.skip)
    .limit(pagination.itemsPerPage)
    .lean();

  res.status(200).json({
    success: true,
    data: {
      products,
      pagination
    }
  });
});

/**
 * @desc    Get featured products
 * @route   GET /api/products/featured
 * @access  Public
 */
exports.getFeaturedProducts = asyncHandler(async (req, res, next) => {
  const limit = req.query.limit || 8;

  const products = await Product.getFeatured(limit);

  res.status(200).json({
    success: true,
    data: { products }
  });
});

/**
 * @desc    Get best sellers
 * @route   GET /api/products/bestsellers
 * @access  Public
 */
exports.getBestSellers = asyncHandler(async (req, res, next) => {
  const limit = req.query.limit || 8;

  const products = await Product.getBestSellers(limit);

  res.status(200).json({
    success: true,
    data: { products }
  });
});

/**
 * @desc    Get new arrivals
 * @route   GET /api/products/new-arrivals
 * @access  Public
 */
exports.getNewArrivals = asyncHandler(async (req, res, next) => {
  const limit = req.query.limit || 8;

  const products = await Product.getNewArrivals(limit);

  res.status(200).json({
    success: true,
    data: { products }
  });
});

/**
 * @desc    Search products
 * @route   GET /api/products/search
 * @access  Public
 */
/**
 * @desc    Search products - FIXED VERSION (Works without text indexes)
 * @route   GET /api/products/search
 * @access  Public
 */
exports.searchProducts = asyncHandler(async (req, res, next) => {
  const { q, limit = 20 } = req.query;

  if (!q || q.trim().length === 0) {
    return next(new ErrorResponse('Search query is required', 400));
  }

  // Create case-insensitive regex for flexible searching
  const searchRegex = new RegExp(q.trim(), 'i');

  // Search in name, description, category, subcategory, and tags
  const products = await Product.find({
    $or: [
      { name: searchRegex },
      { description: searchRegex },
      { category: searchRegex },
      { subcategory: searchRegex },
      { tags: { $elemMatch: { $regex: searchRegex } } }
    ],
    stock: { $gt: 0 } // Only in-stock products
  })
  .limit(parseInt(limit))
  .select('name slug price salePrice images category stock featured bestSeller newArrival')
  .sort({ featured: -1, bestSeller: -1, createdAt: -1 }) // Prioritize featured/bestsellers
  .lean();

  res.status(200).json({
    success: true,
    count: products.length,
    data: {
      products,
      query: q
    }
  });
});
/**
 * @desc    Get products by category
 * @route   GET /api/products/category/:category
 * @access  Public
 */
exports.getProductsByCategory = asyncHandler(async (req, res, next) => {
  const { category } = req.params;
  const { page = 1, limit = 12 } = req.query;

  const query = { category, stock: { $gt: 0 } };
  const totalDocuments = await Product.countDocuments(query);
  const pagination = getPaginationData(page, limit, totalDocuments);

  const products = await Product.find(query)
    .sort('-createdAt')
    .skip(pagination.skip)
    .limit(pagination.itemsPerPage);

  res.status(200).json({
    success: true,
    data: {
      products,
      category,
      pagination
    }
  });
});

/**
 * @desc    Get single product by slug
 * @route   GET /api/products/:slug
 * @access  Public
 */
exports.getProductBySlug = asyncHandler(async (req, res, next) => {
  const product = await Product.findOne({ slug: req.params.slug })
    .populate('createdBy', 'fullName');

  if (!product) {
    return next(new ErrorResponse('Product not found', 404));
  }

  res.status(200).json({
    success: true,
    data: { product }
  });
});

/**
 * @desc    Create product
 * @route   POST /api/products
 * @access  Admin
 */
exports.createProduct = asyncHandler(async (req, res, next) => {
  // Add user ID to product
  req.body.createdBy = req.user.id;

  const product = await Product.create(req.body);

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: { product }
  });
});

/**
 * @desc    Update product
 * @route   PUT /api/products/:id
 * @access  Admin
 */
exports.updateProduct = asyncHandler(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorResponse('Product not found', 404));
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    message: 'Product updated successfully',
    data: { product }
  });
});

/**
 * @desc    Delete product
 * @route   DELETE /api/products/:id
 * @access  Admin
 */
exports.deleteProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorResponse('Product not found', 404));
  }

  // Delete product images from Cloudinary
  if (product.images && product.images.length > 0) {
    const deletePromises = product.images.map(img => deleteImage(img.publicId));
    await Promise.all(deletePromises);
  }

  await product.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Product deleted successfully',
    data: {}
  });
});

/**
 * @desc    Upload product images
 * @route   POST /api/products/:id/images
 * @access  Admin
 */
exports.uploadProductImages = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorResponse('Product not found', 404));
  }

  if (!req.files || req.files.length === 0) {
    return next(new ErrorResponse('Please upload at least one image', 400));
  }

  // Upload images to Cloudinary
  const uploadPromises = req.files.map(file => 
    uploadImage(file.path, 'furniture-hub/products')
  );
  const uploadResults = await Promise.all(uploadPromises);

  // Add images to product
  uploadResults.forEach(result => {
    product.images.push({
      url: result.url,
      publicId: result.publicId,
      alt: product.name
    });
  });

  await product.save();

  res.status(200).json({
    success: true,
    message: 'Images uploaded successfully',
    data: { product }
  });
});

/**
 * @desc    Delete product image
 * @route   DELETE /api/products/:id/images/:publicId
 * @access  Admin
 */
exports.deleteProductImage = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorResponse('Product not found', 404));
  }

  const publicId = req.params.publicId.replace(/-/g, '/'); // Convert back to Cloudinary format

  // Find image
  const imageIndex = product.images.findIndex(img => img.publicId === publicId);

  if (imageIndex === -1) {
    return next(new ErrorResponse('Image not found', 404));
  }

  // Delete from Cloudinary
  await deleteImage(publicId);

  // Remove from product
  product.images.splice(imageIndex, 1);
  await product.save();

  res.status(200).json({
    success: true,
    message: 'Image deleted successfully',
    data: { product }
  });
});