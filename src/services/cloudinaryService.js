/**
 * ============================================
 * CLOUDINARY SERVICE
 * ============================================
 * Image upload, transformation, and deletion
 */

const cloudinary = require('../config/cloudinary');
const { ErrorResponse } = require('../middleware/errorHandler');

/**
 * Upload image to Cloudinary
 * @param {string} filePath - Path to file or base64 string
 * @param {string} folder - Cloudinary folder name
 * @returns {Promise<object>} Upload result with url and publicId
 */
const uploadImage = async (filePath, folder = 'furniture-hub') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'auto',
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height
    };
  } catch (error) {
    throw new ErrorResponse(`Image upload failed: ${error.message}`, 500);
  }
};

/**
 * Upload multiple images
 * @param {Array} files - Array of file paths
 * @param {string} folder - Cloudinary folder name
 * @returns {Promise<Array>} Array of upload results
 */
const uploadMultipleImages = async (files, folder = 'furniture-hub') => {
  try {
    const uploadPromises = files.map(file => uploadImage(file.path, folder));
    return await Promise.all(uploadPromises);
  } catch (error) {
    throw new ErrorResponse(`Multiple image upload failed: ${error.message}`, 500);
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<object>} Deletion result
 */
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result !== 'ok') {
      throw new Error('Failed to delete image');
    }
    
    return result;
  } catch (error) {
    throw new ErrorResponse(`Image deletion failed: ${error.message}`, 500);
  }
};

/**
 * Delete multiple images
 * @param {Array<string>} publicIds - Array of Cloudinary public IDs
 * @returns {Promise<Array>} Array of deletion results
 */
const deleteMultipleImages = async (publicIds) => {
  try {
    const deletePromises = publicIds.map(publicId => deleteImage(publicId));
    return await Promise.all(deletePromises);
  } catch (error) {
    throw new ErrorResponse(`Multiple image deletion failed: ${error.message}`, 500);
  }
};

/**
 * Get optimized image URL with transformations
 * @param {string} publicId - Cloudinary public ID
 * @param {object} options - Transformation options
 * @returns {string} Transformed image URL
 */
const getOptimizedUrl = (publicId, options = {}) => {
  const {
    width = 800,
    height = 800,
    crop = 'fill',
    quality = 'auto:good',
    format = 'auto'
  } = options;

  return cloudinary.url(publicId, {
    transformation: [
      { width, height, crop },
      { quality },
      { fetch_format: format }
    ],
    secure: true
  });
};

/**
 * Generate image thumbnails
 * @param {string} publicId - Cloudinary public ID
 * @returns {object} URLs for different sizes
 */
const generateThumbnails = (publicId) => {
  return {
    thumbnail: getOptimizedUrl(publicId, { width: 150, height: 150 }),
    small: getOptimizedUrl(publicId, { width: 300, height: 300 }),
    medium: getOptimizedUrl(publicId, { width: 600, height: 600 }),
    large: getOptimizedUrl(publicId, { width: 1200, height: 1200 }),
    original: cloudinary.url(publicId, { secure: true })
  };
};

module.exports = {
  uploadImage,
  uploadMultipleImages,
  deleteImage,
  deleteMultipleImages,
  getOptimizedUrl,
  generateThumbnails
};