/**
 * ============================================
 * CATEGORY CONTROLLER
 * ============================================
 */

const Category = require('../models/Category');
const { ErrorResponse, asyncHandler } = require('../middleware/errorHandler');
const { uploadImage, deleteImage } = require('../services/cloudinaryService');

/**
 * @desc    Get all categories
 * @route   GET /api/categories
 * @access  Public
 */
exports.getAllCategories = asyncHandler(async (req, res, next) => {
  const categories = await Category.getWithCounts();

  res.status(200).json({
    success: true,
    data: { categories }
  });
});

/**
 * @desc    Get category by slug
 * @route   GET /api/categories/:slug
 * @access  Public
 */
exports.getCategoryBySlug = asyncHandler(async (req, res, next) => {
  const category = await Category.findOne({ slug: req.params.slug });

  if (!category) {
    return next(new ErrorResponse('Category not found', 404));
  }

  res.status(200).json({
    success: true,
    data: { category }
  });
});

/**
 * @desc    Create category
 * @route   POST /api/categories
 * @access  Admin
 */
exports.createCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.create(req.body);

  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    data: { category }
  });
});

/**
 * @desc    Update category
 * @route   PUT /api/categories/:id
 * @access  Admin
 */
exports.updateCategory = asyncHandler(async (req, res, next) => {
  let category = await Category.findById(req.params.id);

  if (!category) {
    return next(new ErrorResponse('Category not found', 404));
  }

  category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    message: 'Category updated successfully',
    data: { category }
  });
});

/**
 * @desc    Delete category
 * @route   DELETE /api/categories/:id
 * @access  Admin
 */
exports.deleteCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return next(new ErrorResponse('Category not found', 404));
  }

  // Delete category image from Cloudinary
  if (category.image && category.image.publicId) {
    await deleteImage(category.image.publicId);
  }

  await category.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Category deleted successfully',
    data: {}
  });
});