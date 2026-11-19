const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

/**
 * Helper to build consistent date range queries
 */
const buildDateRange = (startDate, endDate) => {
  const dateFilter = {};
  if (startDate) {
    if (typeof startDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(startDate.trim())) {
      const [y, m, d] = startDate.trim().split('-').map(Number);
      dateFilter.$gte = new Date(y, m - 1, d, 0, 0, 0, 0);
    } else {
      const s = new Date(startDate);
      if (!isNaN(s.getTime())) dateFilter.$gte = s;
    }
  }
  if (endDate) {
    if (typeof endDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(endDate.trim())) {
      const [y, m, d] = endDate.trim().split('-').map(Number);
      dateFilter.$lte = new Date(y, m - 1, d, 23, 59, 59, 999);
    } else {
      const e = new Date(endDate);
      if (!isNaN(e.getTime())) {
        if (typeof endDate === 'string' && endDate.length <= 10) {
          e.setHours(23, 59, 59, 999);
        }
        dateFilter.$lte = e;
      }
    }
  }
  return dateFilter;
};

/**
 * @desc    Get comprehensive high-level dashboard metrics
 * @route   GET /api/dashboard/stats
 * @access  Private/Admin
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();

    // Calculate time windows
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Concurrently fetch counts and aggregations
    const [
      // Customer stats
      totalCustomers,
      activeCustomers,
      inactiveCustomers,
      newCustomersLast30Days,

      // Product stats
      totalProducts,
      activeProducts,
      inactiveProducts,
      inStockProducts,
      lowStockProducts,
      outOfStockProducts,

      // Order counts
      totalOrders,
      orderStatusAgg,
      paymentStatusAgg,

      // Revenue aggregations
      totalRevenueAgg,
      todayRevenueAgg,
      thisMonthRevenueAgg,
      prevMonthRevenueAgg,

      // Recent orders
      recentOrders,
    ] = await Promise.all([
      // Customers
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'customer', isActive: true }),
      User.countDocuments({ role: 'customer', isActive: false }),
      User.countDocuments({ role: 'customer', createdAt: { $gte: thirtyDaysAgo } }),

      // Products
      Product.countDocuments({}),
      Product.countDocuments({ status: 'active' }),
      Product.countDocuments({ status: 'inactive' }),
      Product.countDocuments({ $expr: { $gt: ['$stock', '$lowStockThreshold'] } }),
      Product.countDocuments({
        $expr: {
          $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', '$lowStockThreshold'] }],
        },
      }),
      Product.countDocuments({ stock: { $lte: 0 } }),

      // Orders
      Order.countDocuments({}),
      Order.aggregate([
        {
          $group: {
            _id: '$orderStatus',
            count: { $sum: 1 },
          },
        },
      ]),
      Order.aggregate([
        {
          $group: {
            _id: '$paymentStatus',
            count: { $sum: 1 },
          },
        },
      ]),

      // Revenue (strictly paymentStatus: 'paid')
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Order.aggregate([
        {
          $match: {
            paymentStatus: 'paid',
            createdAt: { $gte: startOfToday, $lte: endOfToday },
          },
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Order.aggregate([
        {
          $match: {
            paymentStatus: 'paid',
            createdAt: { $gte: startOfThisMonth },
          },
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Order.aggregate([
        {
          $match: {
            paymentStatus: 'paid',
            createdAt: { $gte: startOfPrevMonth, $lte: endOfPrevMonth },
          },
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),

      // Recent orders (5 latest)
      Order.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'name email phone')
        .select('orderNumber totalAmount paymentStatus orderStatus createdAt items user'),
    ]);

    // Format order status counts
    const ordersByStatus = {
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      on_hold: 0,
      cancelled: 0,
    };
    orderStatusAgg.forEach((item) => {
      if (ordersByStatus.hasOwnProperty(item._id)) {
        ordersByStatus[item._id] = item.count;
      }
    });

    const ordersByPaymentStatus = {
      pending: 0,
      paid: 0,
      failed: 0,
    };
    paymentStatusAgg.forEach((item) => {
      if (ordersByPaymentStatus.hasOwnProperty(item._id)) {
        ordersByPaymentStatus[item._id] = item.count;
      }
    });

    // Format revenue figures
    const totalRevenue = totalRevenueAgg[0]
      ? Number(totalRevenueAgg[0].total.toFixed(2))
      : 0;
    const todayRevenue = todayRevenueAgg[0]
      ? Number(todayRevenueAgg[0].total.toFixed(2))
      : 0;
    const thisMonthRevenue = thisMonthRevenueAgg[0]
      ? Number(thisMonthRevenueAgg[0].total.toFixed(2))
      : 0;
    const previousMonthRevenue = prevMonthRevenueAgg[0]
      ? Number(prevMonthRevenueAgg[0].total.toFixed(2))
      : 0;

    res.status(200).json({
      success: true,
      message: 'Dashboard statistics retrieved successfully',
      data: {
        customers: {
          total: totalCustomers,
          active: activeCustomers,
          inactive: inactiveCustomers,
          newLast30Days: newCustomersLast30Days,
        },
        products: {
          total: totalProducts,
          active: activeProducts,
          inactive: inactiveProducts,
          inStock: inStockProducts,
          lowStock: lowStockProducts,
          outOfStock: outOfStockProducts,
        },
        orders: {
          total: totalOrders,
          byStatus: ordersByStatus,
          byPaymentStatus: ordersByPaymentStatus,
        },
        revenue: {
          total: totalRevenue,
          today: todayRevenue,
          thisMonth: thisMonthRevenue,
          previousMonth: previousMonthRevenue,
          currency: 'INR',
        },
        recentOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get sales analytics grouped by period (daily, weekly, monthly, yearly)
 * @route   GET /api/dashboard/sales
 * @access  Private/Admin
 */
const getSalesAnalytics = async (req, res, next) => {
  try {
    const { period = 'daily', startDate, endDate } = req.query;

    const match = {
      paymentStatus: 'paid',
      ...((startDate || endDate) ? { createdAt: buildDateRange(startDate, endDate) } : {}),
    };

    // Determine grouping format for MongoDB $dateToString
    let dateFormat = '%Y-%m-%d';
    if (period === 'weekly') {
      dateFormat = '%Y-W%V';
    } else if (period === 'monthly') {
      dateFormat = '%Y-%m';
    } else if (period === 'yearly') {
      dateFormat = '%Y';
    }

    // Pipeline projects order items sum to prevent double-counting order totals
    const salesGroup = await Order.aggregate([
      { $match: match },
      {
        $project: {
          totalAmount: 1,
          createdAt: 1,
          orderItemsSold: { $sum: '$items.quantity' },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: dateFormat,
              date: '$createdAt',
              timezone: '+05:30',
            },
          },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
          itemsSold: { $sum: '$orderItemsSold' },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: '$_id',
          revenue: { $round: ['$revenue', 2] },
          orders: 1,
          itemsSold: 1,
        },
      },
    ]);

    // Aggregate totals across the filtered sales
    const totalRevenue = salesGroup.reduce((acc, curr) => acc + curr.revenue, 0);
    const totalOrders = salesGroup.reduce((acc, curr) => acc + curr.orders, 0);
    const totalItemsSold = salesGroup.reduce((acc, curr) => acc + curr.itemsSold, 0);
    const averageOrderValue =
      totalOrders > 0 ? Number((totalRevenue / totalOrders).toFixed(2)) : 0;

    res.status(200).json({
      success: true,
      message: 'Sales analytics retrieved successfully',
      data: {
        period,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalOrders,
        totalItemsSold,
        averageOrderValue,
        currency: 'INR',
        sales: salesGroup,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get top-selling products by quantity and revenue
 * @route   GET /api/dashboard/top-products
 * @access  Private/Admin
 */
const getTopProducts = async (req, res, next) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 5));
    const { startDate, endDate } = req.query;

    const match = {
      paymentStatus: 'paid',
      ...((startDate || endDate) ? { createdAt: buildDateRange(startDate, endDate) } : {}),
    };

    const topProducts = await Order.aggregate([
      { $match: match },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          sku: { $first: '$items.sku' },
          image: { $first: '$items.image' },
          unitPrice: { $avg: '$items.unitPrice' },
          quantitySold: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.subtotal' },
          ordersCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'currentProduct',
        },
      },
      {
        $project: {
          _id: 1,
          productId: '$_id',
          name: 1,
          sku: 1,
          image: 1,
          unitPrice: { $round: ['$unitPrice', 2] },
          quantitySold: 1,
          revenue: { $round: ['$revenue', 2] },
          ordersCount: 1,
          currentStock: { $arrayElemAt: ['$currentProduct.stock', 0] },
          status: { $arrayElemAt: ['$currentProduct.status', 0] },
        },
      },
      { $sort: { quantitySold: -1, revenue: -1 } },
      { $limit: limit },
    ]);

    res.status(200).json({
      success: true,
      message: 'Top-selling products retrieved successfully',
      data: {
        total: topProducts.length,
        products: topProducts,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get best-selling categories by sales volume and revenue
 * @route   GET /api/dashboard/top-categories
 * @access  Private/Admin
 */
const getTopCategories = async (req, res, next) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 5));
    const { startDate, endDate } = req.query;

    const match = {
      paymentStatus: 'paid',
      ...((startDate || endDate) ? { createdAt: buildDateRange(startDate, endDate) } : {}),
    };

    const topCategories = await Order.aggregate([
      { $match: match },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productDoc',
        },
      },
      { $unwind: '$productDoc' },
      {
        $lookup: {
          from: 'categories',
          localField: 'productDoc.category',
          foreignField: '_id',
          as: 'categoryDoc',
        },
      },
      { $unwind: '$categoryDoc' },
      {
        $group: {
          _id: '$categoryDoc._id',
          name: { $first: '$categoryDoc.name' },
          slug: { $first: '$categoryDoc.slug' },
          quantitySold: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.subtotal' },
          orderIds: { $addToSet: '$_id' },
        },
      },
      {
        $project: {
          _id: 1,
          categoryId: '$_id',
          name: 1,
          slug: 1,
          quantitySold: 1,
          revenue: { $round: ['$revenue', 2] },
          ordersCount: { $size: '$orderIds' },
        },
      },
      { $sort: { revenue: -1, quantitySold: -1 } },
      { $limit: limit },
    ]);

    res.status(200).json({
      success: true,
      message: 'Top-selling categories retrieved successfully',
      data: {
        total: topCategories.length,
        categories: topCategories,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getSalesAnalytics,
  getTopProducts,
  getTopCategories,
};
