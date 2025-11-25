/**
 * ============================================
 * UPLOAD MIDDLEWARE - MULTER
 * ============================================
 * Handles file uploads (images) with comprehensive error handling
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = 'uploads/';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir); // Temporary storage before Cloudinary
  },
  filename: (req, file, cb) => {
    // Generate unique filename: fieldname-timestamp-random.ext
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
    cb(null, filename);
  }
});

// File filter - only images
const fileFilter = (req, file, cb) => {
  // Allowed image types
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp'
  ];
  
  const allowedExtensions = /jpeg|jpg|png|gif|webp/;
  
  // Check mime type
  const isMimeTypeValid = allowedMimeTypes.includes(file.mimetype);
  
  // Check extension
  const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());

  if (isMimeTypeValid && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, JPG, PNG, GIF, and WebP images are allowed'));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
    files: 10 // Maximum 10 files per request
  },
  fileFilter: fileFilter
});

/**
 * Multer error handler middleware
 * Converts multer errors to consistent API error format
 */
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer-specific errors
    let message = 'File upload error';
    
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = `File size too large. Maximum size is ${(parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024) / (1024 * 1024)}MB`;
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files. Maximum is 10 files per request';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected field in form data';
        break;
      case 'LIMIT_FIELD_KEY':
        message = 'Field name too long';
        break;
      case 'LIMIT_FIELD_VALUE':
        message = 'Field value too long';
        break;
      case 'LIMIT_FIELD_COUNT':
        message = 'Too many fields';
        break;
      case 'LIMIT_PART_COUNT':
        message = 'Too many parts';
        break;
      default:
        message = err.message;
    }

    return res.status(400).json({
      success: false,
      error: {
        message,
        statusCode: 400,
        code: err.code
      }
    });
  } 
  
  // Other errors (like file type errors from fileFilter)
  if (err) {
    return res.status(400).json({
      success: false,
      error: {
        message: err.message || 'File upload failed',
        statusCode: 400
      }
    });
  }
  
  // No error, continue to next middleware
  next();
};

/**
 * Clean up uploaded files (useful when upload fails after file is saved)
 */
const cleanupFiles = (files) => {
  if (!files) return;
  
  const fileArray = Array.isArray(files) ? files : [files];
  
  fileArray.forEach(file => {
    if (file && file.path) {
      fs.unlink(file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
  });
};

/**
 * Middleware to clean up files on error
 */
const cleanupOnError = (err, req, res, next) => {
  // Clean up any uploaded files if there was an error
  if (err && req.files) {
    cleanupFiles(req.files);
  } else if (err && req.file) {
    cleanupFiles(req.file);
  }
  
  next(err);
};
// Create upload instances
const uploadSingle = upload.single('image');
const uploadMultiple = upload.array('images', 10);

// Export everything properly
module.exports = {
  upload,                    // Base multer instance
  uploadSingle,             // Single file upload
  uploadMultiple,           // Multiple files upload
  handleMulterError,        // Error handler
  cleanupFiles,             // Cleanup utility
  cleanupOnError           // Error cleanup middleware
};