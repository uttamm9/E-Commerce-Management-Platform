const User = require('../models/User');
const Order = require('../models/Order');

/**
 * @desc    Get all customers with search, filter, pagination, and spend metrics
 * @route   GET /api/customers
 * @access  Private/Admin
 */
const getCustomers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const skip = (page - 1) * limit;

    const filter = { role: 'customer' };

    // Search by name, email, or phone
    if (req.query.search) {
      const searchRegex = { $regex: req.query.search.trim(), $options: 'i' };
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
      ];
    }

    // Filter by active status
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true' || req.query.isActive === true;
    }

    const sortOrder = req.query.order === 'asc' ? 1 : -1;
    const sortField = req.query.sortBy || 'createdAt';
    const sort = { [sortField]: sortOrder };

    const [customers, totalRecords] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    // Aggregate order metrics for the current page of customers
    const customerIds = customers.map((c) => c._id);
    let customerMetrics = [];
    if (customerIds.length > 0) {
      customerMetrics = await Order.aggregate([
        { $match: { user: { $in: customerIds } } },
        {
          $group: {
            _id: '$user',
            totalOrders: { $sum: 1 },
            paidOrders: {
              $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] },
            },
            totalSpent: {
              $sum: {
                $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalAmount', 0],
              },
            },
            lastOrderDate: { $max: '$createdAt' },
          },
        },
      ]);
    }

    const metricsMap = new Map();
    customerMetrics.forEach((m) => {
      metricsMap.set(m._id.toString(), {
        totalOrders: m.totalOrders,
        paidOrders: m.paidOrders,
        totalSpent: Number(m.totalSpent.toFixed(2)),
        lastOrderDate: m.lastOrderDate,
      });
    });

    const enrichedCustomers = customers.map((cust) => {
      const metrics = metricsMap.get(cust._id.toString()) || {
        totalOrders: 0,
        paidOrders: 0,
        totalSpent: 0,
        lastOrderDate: null,
      };
      return {
        ...cust,
        metrics,
      };
    });

    res.status(200).json({
      success: true,
      message: 'Customers retrieved successfully',
      data: {
        customers: enrichedCustomers,
        pagination: {
          totalRecords,
          currentPage: page,
          totalPages: Math.ceil(totalRecords / limit) || 1,
          limit,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single customer profile with comprehensive order summary
 * @route   GET /api/customers/:id
 * @access  Private/Admin
 */
const getCustomerById = async (req, res, next) => {
  try {
    const customer = await User.findOne({
      _id: req.params.id,
      role: 'customer',
    }).select('-password');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    const [orderSummary, recentOrders] = await Promise.all([
      Order.aggregate([
        { $match: { user: customer._id } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            paidOrders: {
              $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] },
            },
            totalSpent: {
              $sum: {
                $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalAmount', 0],
              },
            },
            lastOrderDate: { $max: '$createdAt' },
          },
        },
      ]),
      Order.find({ user: customer._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('orderNumber totalAmount paymentStatus orderStatus createdAt items'),
    ]);

    const summary = orderSummary[0] || {
      totalOrders: 0,
      paidOrders: 0,
      totalSpent: 0,
      lastOrderDate: null,
    };

    res.status(200).json({
      success: true,
      message: 'Customer details retrieved successfully',
      data: {
        customer: {
          ...customer.toObject(),
          stats: {
            totalOrders: summary.totalOrders,
            paidOrders: summary.paidOrders,
            totalSpent: Number((summary.totalSpent || 0).toFixed(2)),
            lastOrderDate: summary.lastOrderDate,
          },
        },
        recentOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update customer account status (activate / deactivate)
 * @route   PUT /api/customers/:id/status
 * @access  Private/Admin
 */
const updateCustomerStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Safety guard: Admin status cannot be altered through customer management endpoints
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin account status cannot be modified via customer management.',
      });
    }

    user.isActive = Boolean(req.body.isActive);
    await user.save();

    res.status(200).json({
      success: true,
      message: `Customer account ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        customer: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isActive: user.isActive,
          updatedAt: user.updatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get order history for a specific customer
 * @route   GET /api/customers/:id/orders
 * @access  Private/Admin
 */
const getCustomerOrders = async (req, res, next) => {
  try {
    const customer = await User.findOne({
      _id: req.params.id,
      role: 'customer',
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const skip = (page - 1) * limit;

    const filter = { user: customer._id };
    if (req.query.orderStatus) {
      filter.orderStatus = req.query.orderStatus;
    }
    if (req.query.paymentStatus) {
      filter.paymentStatus = req.query.paymentStatus;
    }

    const [orders, totalRecords] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      message: 'Customer orders retrieved successfully',
      data: {
        customer: {
          _id: customer._id,
          name: customer.name,
          email: customer.email,
        },
        orders,
        pagination: {
          totalRecords,
          currentPage: page,
          totalPages: Math.ceil(totalRecords / limit) || 1,
          limit,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  updateCustomerStatus,
  getCustomerOrders,
};
