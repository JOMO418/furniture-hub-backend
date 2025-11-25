/**
 * ============================================
 * ADMIN CONTROLLER
 * ============================================
 * Admin dashboard and management
 */

const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { ErrorResponse, asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/admin/dashboard
 * @access  Admin
 */
exports.getDashboard = asyncHandler(async (req, res, next) => {
  // Get counts
  const totalUsers = await User.countDocuments();
  const totalProducts = await Product.countDocuments();
  const totalOrders = await Order.countDocuments();
  
  // Get orders by status
  const pendingOrders = await Order.countDocuments({ orderStatus: 'pending' });
  const completedOrders = await Order.countDocuments({ orderStatus: 'delivered' });
  
  // Get revenue (paid orders only)
  const revenueResult = await Order.aggregate([
    { $match: { paymentStatus: 'paid' } },
    { $group: { _id: null, totalRevenue: { $sum: '$total' } } }
  ]);
  const totalRevenue = revenueResult[0]?.totalRevenue || 0;

  // Get recent orders
  const recentOrders = await Order.find()
    .populate('user', 'fullName email')
    .sort('-createdAt')
    .limit(10)
    .select('orderNumber customer total paymentStatus orderStatus createdAt');

  // Get low stock products
  const lowStockProducts = await Product.find({ stock: { $lte: 5 } })
    .select('name stock category')
    .limit(10);

  res.status(200).json({
    success: true,
    data: {
      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
        pendingOrders,
        completedOrders,
        totalRevenue
      },
      recentOrders,
      lowStockProducts
    }
  });
});

/**
 * @desc    Get all users
 * @route   GET /api/admin/users
 * @access  Admin
 */
exports.getAllUsers = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 50, search } = req.query;

  const query = {};
  if (search) {
    query.$or = [
      { fullName: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
      { phone: new RegExp(search, 'i') }
    ];
  }

  const users = await User.find(query)
    .select('-password')
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await User.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

/**
 * @desc    Update user role
 * @route   PUT /api/admin/users/:id/role
 * @access  Admin
 */
exports.updateUserRole = asyncHandler(async (req, res, next) => {
  const { role } = req.body;

  if (!role || !['customer', 'admin'].includes(role)) {
    return next(new ErrorResponse('Valid role is required (customer/admin)', 400));
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  // Prevent self-demotion
  if (user._id.toString() === req.user.id && role !== 'admin') {
    return next(new ErrorResponse('Cannot change your own role', 400));
  }

  user.role = role;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'User role updated successfully',
    data: { user }
  });
});

/**
 * @desc    Delete user
 * @route   DELETE /api/admin/users/:id
 * @access  Admin
 */
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  // Prevent self-deletion
  if (user._id.toString() === req.user.id) {
    return next(new ErrorResponse('Cannot delete your own account', 400));
  }

  await user.deleteOne();

  res.status(200).json({
    success: true,
    message: 'User deleted successfully',
    data: {}
  });
});

/**
 * @desc    Get sales analytics
 * @route   GET /api/admin/analytics/sales
 * @access  Admin
 */
exports.getSalesAnalytics = asyncHandler(async (req, res, next) => {
  const { period = 'month' } = req.query;

  // Calculate date range
  const now = new Date();
  let startDate;

  switch (period) {
    case 'week':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  // Get sales stats
  const stats = await Order.getSalesStats(startDate, now);

  // Get sales by category
  const categoryStats = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: now },
        paymentStatus: 'paid'
      }
    },
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'products',
        localField: 'items.product',
        foreignField: '_id',
        as: 'productInfo'
      }
    },
    { $unwind: '$productInfo' },
    {
      $group: {
        _id: '$productInfo.category',
        totalSales: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        totalOrders: { $sum: 1 }
      }
    },
    { $sort: { totalSales: -1 } }
  ]);

  res.status(200).json({
    success: true,
    data: {
      period,
      stats: stats[0] || { totalOrders: 0, totalRevenue: 0, averageOrderValue: 0 },
      categoryStats
    }
  });
});

/**
 * @desc    Get low stock products
 * @route   GET /api/admin/products/low-stock
 * @access  Admin
 */
exports.getLowStockProducts = asyncHandler(async (req, res, next) => {
  const { threshold = 10 } = req.query;

  const products = await Product.find({ stock: { $lte: threshold } })
    .select('name slug stock category price')
    .sort('stock');

  res.status(200).json({
    success: true,
    data: { products }
  });
});