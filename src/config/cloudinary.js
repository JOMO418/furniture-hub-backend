/**
 * ============================================
 * CLOUDINARY CONFIGURATION
 * ============================================
 * Image upload and storage service
 */

const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Test connection
const testConnection = async () => {
  try {
    await cloudinary.api.ping();
    console.log('✅ Cloudinary Connected');
    return true;
  } catch (error) {
    console.error(`❌ Cloudinary Connection Failed: ${error.message}`);
    return false;
  }
};

// Test connection on startup (optional)
if (process.env.NODE_ENV === 'development') {
  testConnection();
}

module.exports = cloudinary;