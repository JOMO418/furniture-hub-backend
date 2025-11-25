const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getSalesAnalytics,
  getLowStockProducts
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeAdmin } = require('../middleware/adminMiddleware');
const { validateObjectId } = require('../middleware/validateRequest');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validateRequest');

// All admin routes require authentication and admin role
router.use(protect);
router.use(authorizeAdmin);

// Dashboard
router.get('/dashboard', getDashboard);

// Users management
router.get('/users', getAllUsers);

// Update user role validation
const validateUserRole = [
  body('role')
    .notEmpty().withMessage('Role is required')
    .isIn(['customer', 'admin']).withMessage('Invalid role'),
  handleValidationErrors
];
router.put('/users/:id/role', validateObjectId, validateUserRole, updateUserRole);
router.delete('/users/:id', validateObjectId, deleteUser);

// Analytics
router.get('/analytics/sales', getSalesAnalytics);
router.get('/products/low-stock', getLowStockProducts);

module.exports = router;
