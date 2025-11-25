/**
 * ============================================
 * VALIDATION UTILITIES
 * ============================================
 * Common validation functions
 */

/**
 * Validate email format
 */
const isValidEmail = (email) => {
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return emailRegex.test(email);
  };
  
  /**
   * Validate Kenyan phone number
   */
  const isValidKenyanPhone = (phone) => {
    // Accepts: 0712345678, +254712345678, 254712345678
    const phoneRegex = /^(\+254|254|0)[17]\d{8}$/;
    return phoneRegex.test(phone.replace(/[\s\-]/g, ''));
  };
  
  /**
   * Validate password strength
   */
  const isStrongPassword = (password) => {
    // At least 6 characters
    if (password.length < 6) {
      return {
        valid: false,
        message: 'Password must be at least 6 characters long'
      };
    }
  
    // Optional: Add more requirements
    // - At least one uppercase letter
    // - At least one lowercase letter
    // - At least one number
    // const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  
    return {
      valid: true,
      message: 'Password is valid'
    };
  };
  
  /**
   * Validate MongoDB ObjectId
   */
  const isValidObjectId = (id) => {
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    return objectIdRegex.test(id);
  };
  
  /**
   * Validate price
   */
  const isValidPrice = (price) => {
    return typeof price === 'number' && price >= 0 && !isNaN(price);
  };
  
  /**
   * Validate quantity
   */
  const isValidQuantity = (quantity) => {
    return Number.isInteger(quantity) && quantity > 0;
  };
  
  /**
   * Sanitize string input
   */
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return '';
    
    return str
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .substring(0, 1000); // Limit length
  };
  
  /**
   * Validate product data
   */
  const validateProductData = (data) => {
    const errors = [];
  
    if (!data.name || data.name.trim().length === 0) {
      errors.push('Product name is required');
    }
  
    if (!data.description || data.description.trim().length === 0) {
      errors.push('Product description is required');
    }
  
    if (!isValidPrice(data.price)) {
      errors.push('Valid price is required');
    }
  
    if (!data.category) {
      errors.push('Product category is required');
    }
  
    if (!isValidQuantity(data.stock)) {
      errors.push('Valid stock quantity is required');
    }
  
    return {
      valid: errors.length === 0,
      errors
    };
  };
  
  /**
   * Validate order data
   */
  const validateOrderData = (data) => {
    const errors = [];
  
    if (!data.items || data.items.length === 0) {
      errors.push('Order must contain at least one item');
    }
  
    if (!data.customer || !data.customer.fullName) {
      errors.push('Customer name is required');
    }
  
    if (!data.customer || !isValidEmail(data.customer.email)) {
      errors.push('Valid customer email is required');
    }
  
    if (!data.customer || !isValidKenyanPhone(data.customer.phone)) {
      errors.push('Valid customer phone number is required');
    }
  
    if (!data.customer || !data.customer.address) {
      errors.push('Delivery address is required');
    }
  
    if (!data.customer || !data.customer.city) {
      errors.push('City is required');
    }
  
    if (!isValidPrice(data.total)) {
      errors.push('Valid order total is required');
    }
  
    return {
      valid: errors.length === 0,
      errors
    };
  };
  
  /**
   * Validate M-Pesa phone number format
   */
  const validateMpesaPhone = (phone) => {
    try {
      // Remove spaces, dashes, and plus signs
      let cleaned = phone.replace(/[\s\-\+]/g, '');
  
      // Must be a valid Kenyan number
      if (!isValidKenyanPhone(cleaned)) {
        return {
          valid: false,
          message: 'Invalid Kenyan phone number'
        };
      }
  
      return {
        valid: true,
        message: 'Phone number is valid'
      };
  
    } catch (error) {
      return {
        valid: false,
        message: 'Invalid phone number format'
      };
    }
  };
  
  /**
   * Validate image file
   */
  const validateImageFile = (file) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB
  
    if (!file) {
      return {
        valid: false,
        message: 'No file provided'
      };
    }
  
    if (!allowedTypes.includes(file.mimetype)) {
      return {
        valid: false,
        message: 'Invalid file type. Only JPEG, PNG, and WebP are allowed'
      };
    }
  
    if (file.size > maxSize) {
      return {
        valid: false,
        message: 'File size exceeds 5MB limit'
      };
    }
  
    return {
      valid: true,
      message: 'File is valid'
    };
  };
  
  module.exports = {
    isValidEmail,
    isValidKenyanPhone,
    isStrongPassword,
    isValidObjectId,
    isValidPrice,
    isValidQuantity,
    sanitizeString,
    validateProductData,
    validateOrderData,
    validateMpesaPhone,
    validateImageFile
  };