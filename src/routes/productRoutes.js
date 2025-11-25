const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getFeaturedProducts,
  getBestSellers,
  getNewArrivals,
  searchProducts,
  getProductsByCategory,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImages,
  deleteProductImage
} = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeAdmin } = require('../middleware/adminMiddleware');
const { uploadMultiple, handleMulterError } = require('../middleware/uploadMiddleware');
const {
  validateProduct,
  validateObjectId
} = require('../middleware/validateRequest');

// Public routes
router.get('/', getAllProducts);
router.get('/featured', getFeaturedProducts);
router.get('/bestsellers', getBestSellers);
router.get('/new-arrivals', getNewArrivals);
router.get('/search', searchProducts);
router.get('/category/:category', getProductsByCategory);
router.get('/:slug', getProductBySlug);

// Admin routes
router.post('/', protect, authorizeAdmin, validateProduct, createProduct);
router.put('/:id', protect, authorizeAdmin, validateObjectId, validateProduct, updateProduct);
router.delete('/:id', protect, authorizeAdmin, validateObjectId, deleteProduct);

// Image upload routes
router.post(
  '/:id/images',
  protect,
  authorizeAdmin,
  validateObjectId,
  uploadMultiple,
  handleMulterError,
  uploadProductImages
);
router.delete('/:id/images/:publicId', protect, authorizeAdmin, validateObjectId, deleteProductImage);

module.exports = router;
