const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const {
  validateUpdateProfile,
  validateChangePassword,
  validateObjectId
} = require('../middleware/validateRequest');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validateRequest');

// All user routes require authentication
router.use(protect);

// Profile management
router.get('/profile', getProfile);
router.put('/profile', validateUpdateProfile, updateProfile);
router.put('/change-password', validateChangePassword, changePassword);
router.delete('/account', deleteAccount);

// Address validation
const validateAddress = [
  body('street').trim().notEmpty().withMessage('Street is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('country').trim().notEmpty().withMessage('Country is required'),
  body('isDefault').optional().isBoolean().withMessage('isDefault must be boolean'),
  handleValidationErrors
];

// Address management
router.get('/addresses', getAddresses);
router.post('/addresses', validateAddress, addAddress);
router.put('/addresses/:addressId', validateObjectId, validateAddress, updateAddress);
router.delete('/addresses/:addressId', validateObjectId, deleteAddress);
router.patch('/addresses/:addressId/default', validateObjectId, setDefaultAddress);

module.exports = router;