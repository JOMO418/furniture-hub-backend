/**
 * ============================================
 * FURNITURE HUB - MAIN SERVER FILE
 * ============================================
 * Entry point for the Express application
 */

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');

// Load environment variables (only if .env file exists - for local development)
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
  console.log('📁 Loaded .env file for local development');
} else {
  console.log('☁️  Using cloud environment variables (Railway/Render)');
}

// ⚠️ CRITICAL: Validate required environment variables
console.log('\n🔍 Environment Variables Check:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('PORT:', process.env.PORT || 'not set');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL || 'not set');
console.log('MONGODB_URI exists?:', !!process.env.MONGODB_URI);
console.log('MONGODB_URI length:', process.env.MONGODB_URI?.length || 0);
console.log('JWT_SECRET exists?:', !!process.env.JWT_SECRET);
console.log('CLOUDINARY configured?:', !!process.env.CLOUDINARY_CLOUD_NAME);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Exit if critical variables are missing
if (!process.env.MONGODB_URI) {
  console.error('❌ FATAL ERROR: MONGODB_URI environment variable is not defined!');
  console.error('Please set MONGODB_URI in Railway dashboard or .env file');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error('❌ FATAL ERROR: JWT_SECRET environment variable is not defined!');
  process.exit(1);
}

// Import database connection
const connectDB = require('./src/config/database');

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const productRoutes = require('./src/routes/productRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const cartRoutes = require('./src/routes/cartRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');
const adminRoutes = require('./src/routes/adminRoutes');

// Import error handler
const errorHandler = require('./src/middleware/errorHandler');

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// ==================
// MIDDLEWARE
// ==================

// Security: Set security headers
app.use(helmet());

// CORS: Allow frontend to access API
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://furniturehubke.netlify.app',
      process.env.FRONTEND_URL
    ];
    
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser: Parse JSON requests
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security: Sanitize data to prevent NoSQL injection
app.use(mongoSanitize());

// Security: Prevent XSS attacks
app.use(xss());

// Rate limiting: Prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX || 100, // limit each IP
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again later.',
      statusCode: 429
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ==================
// ROUTES
// ==================

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Furniture Hub API is running! 🪑🛋️',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.originalUrl} not found`,
      statusCode: 404
    }
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// ==================
// START SERVER
// ==================

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║   🪑 FURNITURE HUB API SERVER 🛋️      ║
╠═══════════════════════════════════════╣
║  Environment: ${process.env.NODE_ENV || 'development'}                  ║
║  Port: ${PORT}                             ║
║  URL: ${process.env.NODE_ENV === 'production' ? 'Railway/Production' : `http://localhost:${PORT}`}  ║
╚═══════════════════════════════════════╝
  `);
  console.log('✅ Server is ready to accept connections!\n');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`❌ Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error(`❌ Uncaught Exception: ${err.message}`);
  process.exit(1);
});

module.exports = app;