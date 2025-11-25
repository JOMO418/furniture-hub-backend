/**
 * ============================================
 * HELPER UTILITIES
 * ============================================
 * Common helper functions
 */

/**
 * Format price to Kenyan Shillings
 */
const formatPrice = (price) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(price);
  };
  
  /**
   * Generate random string
   */
  const generateRandomString = (length = 10) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    return result;
  };
  
  /**
   * Calculate pagination
   */
  const getPaginationData = (page, limit, totalDocuments) => {
    const currentPage = parseInt(page) || 1;
    const itemsPerPage = parseInt(limit) || 12;
    const totalPages = Math.ceil(totalDocuments / itemsPerPage);
    const skip = (currentPage - 1) * itemsPerPage;
  
    return {
      currentPage,
      itemsPerPage,
      totalPages,
      totalDocuments,
      skip,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1
    };
  };
  
  /**
   * Calculate delivery fee based on location
   */
  const calculateDeliveryFee = (city) => {
    const deliveryRates = {
      'nairobi': 0,
      'mombasa': 1000,
      'kisumu': 1500,
      'nakuru': 800,
      'eldoret': 1200,
      'thika': 500,
      'default': 1000
    };
  
    const normalizedCity = city.toLowerCase().trim();
    return deliveryRates[normalizedCity] || deliveryRates.default;
  };
  
  /**
   * Format date to readable string
   */
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  /**
   * Format date and time
   */
  const formatDateTime = (date) => {
    return new Date(date).toLocaleString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  /**
   * Calculate time ago
   */
  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' years ago';
  
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';
  
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';
  
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';
  
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutes ago';
  
    return Math.floor(seconds) + ' seconds ago';
  };
  
  /**
   * Generate order number
   */
  const generateOrderNumber = (count) => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const orderNum = String(count + 1).padStart(4, '0');
    
    return `ORD-${year}${month}${day}-${orderNum}`;
  };
  
  /**
   * Clean object - remove undefined/null values
   */
  const cleanObject = (obj) => {
    const cleaned = {};
    
    Object.keys(obj).forEach(key => {
      if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
        cleaned[key] = obj[key];
      }
    });
    
    return cleaned;
  };
  
  /**
   * Check if value exists in array
   */
  const isInArray = (array, value) => {
    return Array.isArray(array) && array.includes(value);
  };
  
  /**
   * Remove duplicates from array
   */
  const removeDuplicates = (array) => {
    return [...new Set(array)];
  };
  
  /**
   * Shuffle array
   */
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };
  
  /**
   * Get random items from array
   */
  const getRandomItems = (array, count) => {
    const shuffled = shuffleArray(array);
    return shuffled.slice(0, count);
  };
  
  /**
   * Capitalize first letter
   */
  const capitalizeFirst = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };
  
  /**
   * Truncate string
   */
  const truncateString = (str, maxLength = 100) => {
    if (!str || str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '...';
  };
  
  /**
   * Sleep/delay function
   */
  const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };
  
  /**
   * Check if object is empty
   */
  const isEmpty = (obj) => {
    return Object.keys(obj).length === 0;
  };
  
  /**
   * Deep clone object
   */
  const deepClone = (obj) => {
    return JSON.parse(JSON.stringify(obj));
  };
  
  /**
   * Format phone number for display
   */
  const formatPhoneDisplay = (phone) => {
    // Convert 254712345678 to +254 712 345 678
    let cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.startsWith('254')) {
      cleaned = '+254 ' + cleaned.substring(3, 6) + ' ' + 
                cleaned.substring(6, 9) + ' ' + cleaned.substring(9);
    } else if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(0, 4) + ' ' + 
                cleaned.substring(4, 7) + ' ' + cleaned.substring(7);
    }
    
    return cleaned;
  };
  
  /**
   * Calculate discount percentage
   */
  const calculateDiscount = (originalPrice, salePrice) => {
    if (!salePrice || salePrice >= originalPrice) return 0;
    return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
  };
  
  /**
   * Retry async function
   */
  const retryAsync = async (fn, maxRetries = 3, delay = 1000) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await sleep(delay);
      }
    }
  };
  
  module.exports = {
    formatPrice,
    generateRandomString,
    getPaginationData,
    calculateDeliveryFee,
    formatDate,
    formatDateTime,
    timeAgo,
    generateOrderNumber,
    cleanObject,
    isInArray,
    removeDuplicates,
    shuffleArray,
    getRandomItems,
    capitalizeFirst,
    truncateString,
    sleep,
    isEmpty,
    deepClone,
    formatPhoneDisplay,
    calculateDiscount,
    retryAsync
  };