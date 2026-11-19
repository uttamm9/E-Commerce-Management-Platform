const Order = require('../models/Order');
const Product = require('../models/Product');
const { formatCSV } = require('../utils/csvHelper');

/**
 * Helper to build date range filter on createdAt
 */
const buildDateFilter = (startDate, endDate) => {
  const filter = {};
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) {
      if (typeof startDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(startDate.trim())) {
        const [y, m, d] = startDate.trim().split('-').map(Number);
        filter.createdAt.$gte = new Date(y, m - 1, d, 0, 0, 0, 0);
      } else {
        const s = new Date(startDate);
        if (!isNaN(s.getTime())) {
          filter.createdAt.$gte = s;
        }
      }
    }
    if (endDate) {
      if (typeof endDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(endDate.trim())) {
        const [y, m, d] = endDate.trim().split('-').map(Number);
        filter.createdAt.$lte = new Date(y, m - 1, d, 23, 59, 59, 999);
      } else {
        const e = new Date(endDate);
        if (!isNaN(e.getTime())) {
          if (typeof endDate === 'string' && endDate.length <= 10) {
            e.setHours(23, 59, 59, 999);
          }
          filter.createdAt.$lte = e;
        }
      }
    }
  }
  return filter;
};

/**
 * @desc    Get comprehensive sales report with breakdown
 * @route   GET /api/reports/sales
 * @access  Private/Admin
 */
const getSalesReport = async (req, res, next) => {
  try {
    const { period = 'daily', startDate, endDate } = req.query;

    const match = {
      paymentStatus: 'paid',
      ...buildDateFilter(startDate, endDate),
    };

    let dateFormat = '%Y-%m-%d';
    if (period === 'weekly') {
      dateFormat = '%Y-W%V';
    } else if (period === 'monthly') {
      dateFormat = '%Y-%m';
    } else if (period === 'yearly') {
      dateFormat = '%Y';
    }

    const salesBreakdown = await Order.aggregate([
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

    const totalRevenue = salesBreakdown.reduce((acc, curr) => acc + curr.revenue, 0);
    const totalPaidOrders = salesBreakdown.reduce((acc, curr) => acc + curr.orders, 0);
    const totalItemsSold = salesBreakdown.reduce((acc, curr) => acc + curr.itemsSold, 0);
    const averageOrderValue =
      totalPaidOrders > 0 ? Number((totalRevenue / totalPaidOrders).toFixed(2)) : 0;

    res.status(200).json({
      success: true,
      message: 'Sales report generated successfully',
      data: {
        summary: {
          period,
          totalRevenue: Number(totalRevenue.toFixed(2)),
          totalPaidOrders,
          totalItemsSold,
          averageOrderValue,
          currency: 'INR',
        },
        records: salesBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Export sales report to CSV format
 * @route   GET /api/reports/sales/export
 * @access  Private/Admin
 */
const exportSalesReportCSV = async (req, res, next) => {
  try {
    const { period = 'daily', startDate, endDate } = req.query;

    const match = {
      paymentStatus: 'paid',
      ...buildDateFilter(startDate, endDate),
    };

    let dateFormat = '%Y-%m-%d';
    if (period === 'weekly') {
      dateFormat = '%Y-W%V';
    } else if (period === 'monthly') {
      dateFormat = '%Y-%m';
    } else if (period === 'yearly') {
      dateFormat = '%Y';
    }

    const salesBreakdown = await Order.aggregate([
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
    ]);

    const headers = ['Date', 'Orders', 'Items Sold', 'Revenue (INR)'];
    const rows = salesBreakdown.map((item) => [
      item._id,
      item.orders,
      item.itemsSold,
      item.revenue.toFixed(2),
    ]);

    const csvContent = formatCSV(headers, rows);
    const dateStamp = new Date().toISOString().slice(0, 10);
    const filename = `sales-report-${dateStamp}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get order report with summary metrics and paginated records
 * @route   GET /api/reports/orders
 * @access  Private/Admin
 */
const getOrderReport = async (req, res, next) => {
  try {
    const { startDate, endDate, orderStatus, paymentStatus } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const skip = (page - 1) * limit;

    const filter = { ...buildDateFilter(startDate, endDate) };

    if (orderStatus) {
      filter.orderStatus = orderStatus;
    }
    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }

    // Parallel summary metrics and paginated orders
    const [orders, totalRecords, summaryAgg] = await Promise.all([
      Order.find(filter)
        .populate('user', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
      Order.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalAmount: { $sum: '$totalAmount' },
            paidRevenue: {
              $sum: {
                $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalAmount', 0],
              },
            },
            paidOrdersCount: {
              $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] },
            },
          },
        },
      ]),
    ]);

    const summary = summaryAgg[0] || {
      totalOrders: 0,
      totalAmount: 0,
      paidRevenue: 0,
      paidOrdersCount: 0,
    };

    res.status(200).json({
      success: true,
      message: 'Order report generated successfully',
      data: {
        summary: {
          totalOrders: summary.totalOrders,
          totalAmount: Number(summary.totalAmount.toFixed(2)),
          paidRevenue: Number(summary.paidRevenue.toFixed(2)),
          paidOrdersCount: summary.paidOrdersCount,
          currency: 'INR',
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

/**
 * @desc    Export order report to CSV format
 * @route   GET /api/reports/orders/export
 * @access  Private/Admin
 */
const exportOrderReportCSV = async (req, res, next) => {
  try {
    const { startDate, endDate, orderStatus, paymentStatus } = req.query;
    const filter = { ...buildDateFilter(startDate, endDate) };

    if (orderStatus) {
      filter.orderStatus = orderStatus;
    }
    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }

    const orders = await Order.find(filter)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .lean();

    const headers = [
      'Order Number',
      'Date',
      'Customer Name',
      'Customer Email',
      'Items Count',
      'Subtotal (INR)',
      'Tax (INR)',
      'Shipping (INR)',
      'Total (INR)',
      'Payment Status',
      'Order Status',
    ];

    const rows = orders.map((order) => {
      const itemsCount = (order.items || []).reduce((sum, item) => sum + item.quantity, 0);
      const orderDate = order.createdAt ? new Date(order.createdAt).toISOString().replace('T', ' ').slice(0, 19) : '';
      return [
        order.orderNumber,
        orderDate,
        order.user ? order.user.name : (order.shippingAddress ? order.shippingAddress.fullName : 'Guest'),
        order.user ? order.user.email : '',
        itemsCount,
        order.subtotal ? order.subtotal.toFixed(2) : '0.00',
        order.taxAmount ? order.taxAmount.toFixed(2) : '0.00',
        order.shippingFee ? order.shippingFee.toFixed(2) : '0.00',
        order.totalAmount ? order.totalAmount.toFixed(2) : '0.00',
        order.paymentStatus,
        order.orderStatus,
      ];
    });

    const csvContent = formatCSV(headers, rows);
    const dateStamp = new Date().toISOString().slice(0, 10);
    const filename = `orders-report-${dateStamp}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get inventory report with stock levels and threshold alerts
 * @route   GET /api/reports/inventory
 * @access  Private/Admin
 */
const getInventoryReport = async (req, res, next) => {
  try {
    const { status, category } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const skip = (page - 1) * limit;

    const filter = {};
    if (category) {
      filter.category = category;
    }

    if (status === 'out_of_stock') {
      filter.stock = { $lte: 0 };
    } else if (status === 'low_stock') {
      filter.$expr = {
        $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', '$lowStockThreshold'] }],
      };
    } else if (status === 'in_stock') {
      filter.$expr = { $gt: ['$stock', '$lowStockThreshold'] };
    }

    const [products, totalRecords, inStockCount, lowStockCount, outOfStockCount, totalProducts] =
      await Promise.all([
        Product.find(filter)
          .populate('category', 'name slug')
          .sort({ stock: 1, name: 1 })
          .skip(skip)
          .limit(limit),
        Product.countDocuments(filter),
        Product.countDocuments({
          ...(category ? { category } : {}),
          $expr: { $gt: ['$stock', '$lowStockThreshold'] },
        }),
        Product.countDocuments({
          ...(category ? { category } : {}),
          $expr: {
            $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', '$lowStockThreshold'] }],
          },
        }),
        Product.countDocuments({
          ...(category ? { category } : {}),
          stock: { $lte: 0 },
        }),
        Product.countDocuments(category ? { category } : {}),
      ]);

    res.status(200).json({
      success: true,
      message: 'Inventory report generated successfully',
      data: {
        summary: {
          totalProducts,
          inStockCount,
          lowStockCount,
          outOfStockCount,
        },
        products,
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
 * @desc    Export inventory report to CSV format
 * @route   GET /api/reports/inventory/export
 * @access  Private/Admin
 */
const exportInventoryReportCSV = async (req, res, next) => {
  try {
    const { status, category } = req.query;

    const filter = {};
    if (category) {
      filter.category = category;
    }

    if (status === 'out_of_stock') {
      filter.stock = { $lte: 0 };
    } else if (status === 'low_stock') {
      filter.$expr = {
        $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', '$lowStockThreshold'] }],
      };
    } else if (status === 'in_stock') {
      filter.$expr = { $gt: ['$stock', '$lowStockThreshold'] };
    }

    const products = await Product.find(filter)
      .populate('category', 'name slug')
      .sort({ stock: 1, name: 1 });

    const headers = [
      'Product Name',
      'SKU',
      'Category',
      'Brand',
      'Price (INR)',
      'Discount Price (INR)',
      'Stock',
      'Low Stock Threshold',
      'Availability Status',
      'Status',
    ];

    const rows = products.map((product) => [
      product.name,
      product.sku,
      product.category ? product.category.name : '',
      product.brand || '',
      product.price ? product.price.toFixed(2) : '0.00',
      product.discountPrice ? product.discountPrice.toFixed(2) : '0.00',
      product.stock,
      product.lowStockThreshold,
      product.availability,
      product.status,
    ]);

    const csvContent = formatCSV(headers, rows);
    const dateStamp = new Date().toISOString().slice(0, 10);
    const filename = `inventory-report-${dateStamp}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSalesReport,
  exportSalesReportCSV,
  getOrderReport,
  exportOrderReportCSV,
  getInventoryReport,
  exportInventoryReportCSV,
};
