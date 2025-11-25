const express = require('express');
const router = express.Router();
const {
  getAllCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeAdmin } = require('../middleware/adminMiddleware');
const {
  validateCategory,
  validateObjectId
} = require('../middleware/validateRequest');

// Public routes
router.get('/', getAllCategories);
router.get('/:slug', getCategoryBySlug);

// Admin routes
router.post('/', protect, authorizeAdmin, validateCategory, createCategory);
router.put('/:id', protect, authorizeAdmin, validateObjectId, validateCategory, updateCategory);
router.delete('/:id', protect, authorizeAdmin, validateObjectId, deleteCategory);

module.exports = router;