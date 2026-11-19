const crypto = require('crypto');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const generateInvoice = require('../utils/generateInvoice');

/**
 * @desc    Customer checkout - create a pending order from database cart
 * @route   POST /api/orders/checkout
 * @access  Private/Customer
 */
const checkout = async (req, res, next) => {
  try {
    const { shippingAddress } = req.body;

    // Fetch customer's cart
    const cart = await Cart.findOne({ user: req.user._id }).populate({
      path: 'items.product',
      populate: { path: 'category' },
    });

    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot proceed to checkout with an empty shopping cart',
      });
    }

    const orderItems = [];
    let subtotal = 0;

    // Validate each cart item against database stock and status
    for (const item of cart.items) {
      const product = item.product;

      if (!product) {
        return res.status(400).json({
          success: false,
          message: 'A product in your cart is no longer available. Please review your cart.',
        });
      }

      if (product.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: `Product '${product.name}' is currently unavailable.`,
        });
      }

      if (product.category && product.category.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: `Category for product '${product.name}' is currently inactive.`,
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for '${product.name}'. Only ${product.stock} available, but ${item.quantity} requested.`,
        });
      }

      // Determine effective purchase price
      const effectivePrice =
        product.discountPrice > 0 && product.discountPrice < product.price
          ? product.discountPrice
          : product.price;

      const itemSubtotal = parseFloat((effectivePrice * item.quantity).toFixed(2));
      subtotal += itemSubtotal;

      // Save complete snapshot of product details
      orderItems.push({
        product: product._id,
        name: product.name,
        sku: product.sku,
        image: product.images && product.images.length > 0 ? product.images[0].url : '',
        quantity: item.quantity,
        unitPrice: effectivePrice,
        subtotal: itemSubtotal,
      });
    }

    subtotal = parseFloat(subtotal.toFixed(2));

    // Backend calculations: Free shipping if >= 1000, else flat 50 INR; 5% GST
    const shippingFee = subtotal >= 1000 ? 0 : 50;
    const taxAmount = parseFloat((subtotal * 0.05).toFixed(2));
    const totalAmount = parseFloat((subtotal + shippingFee + taxAmount).toFixed(2));

    // Generate unique order number (e.g. ORD-20261118-8A9F1B)
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    const orderNumber = `ORD-${dateStr}-${randomHex}`;

    // Create pending order document
    const order = await Order.create({
      user: req.user._id,
      orderNumber,
      items: orderItems,
      shippingAddress: {
        fullName: shippingAddress.fullName.trim(),
        phone: shippingAddress.phone.trim(),
        addressLine1: shippingAddress.addressLine1.trim(),
        addressLine2: (shippingAddress.addressLine2 || '').trim(),
        city: shippingAddress.city.trim(),
        state: shippingAddress.state.trim(),
        postalCode: shippingAddress.postalCode.trim(),
        country: (shippingAddress.country || 'India').trim(),
      },
      subtotal,
      shippingFee,
      taxAmount,
      totalAmount,
      currency: 'INR',
      paymentMethod: 'razorpay',
      paymentStatus: 'pending',
      orderStatus: 'pending',
      inventoryDeducted: false,
      statusHistory: [
        {
          status: 'pending',
          note: 'Order created via checkout, awaiting payment',
          updatedAt: new Date(),
          updatedBy: req.user._id,
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        order,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get order history for logged-in customer
 * @route   GET /api/orders/my-orders
 * @access  Private/Customer
 */
const getMyOrders = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const skip = (page - 1) * limit;

    const filter = { user: req.user._id };

    const [orders, totalRecords] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Order.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      message: 'Customer orders fetched successfully',
      data: {
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
 * @desc    Get single order details
 * @route   GET /api/orders/:id
 * @access  Private/Owner or Admin
 */
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Customer can only view their own order; Admin can view any
    const isOwner = order.user._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You cannot view another customer’s order.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order details fetched successfully',
      data: {
        order,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all orders across system
 * @route   GET /api/orders
 * @access  Private/Admin
 */
const getAllOrders = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.search) {
      filter.orderNumber = { $regex: req.query.search.trim(), $options: 'i' };
    }
    if (req.query.orderStatus) {
      filter.orderStatus = req.query.orderStatus;
    }
    if (req.query.paymentStatus) {
      filter.paymentStatus = req.query.paymentStatus;
    }

    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) {
        if (typeof req.query.startDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(req.query.startDate.trim())) {
          const [y, m, d] = req.query.startDate.trim().split('-').map(Number);
          filter.createdAt.$gte = new Date(y, m - 1, d, 0, 0, 0, 0);
        } else {
          const start = new Date(req.query.startDate);
          if (!isNaN(start.getTime())) {
            filter.createdAt.$gte = start;
          }
        }
      }
      if (req.query.endDate) {
        if (typeof req.query.endDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(req.query.endDate.trim())) {
          const [y, m, d] = req.query.endDate.trim().split('-').map(Number);
          filter.createdAt.$lte = new Date(y, m - 1, d, 23, 59, 59, 999);
        } else {
          const end = new Date(req.query.endDate);
          if (!isNaN(end.getTime())) {
            if (typeof req.query.endDate === 'string' && req.query.endDate.length <= 10) {
              end.setHours(23, 59, 59, 999);
            }
            filter.createdAt.$lte = end;
          }
        }
      }
    }

    const sortOrder = req.query.order === 'asc' ? 1 : -1;
    const sortField = req.query.sortBy || 'createdAt';
    const sort = { [sortField]: sortOrder };

    const [orders, totalRecords] = await Promise.all([
      Order.find(filter)
        .populate('user', 'name email phone')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Order.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      message: 'All orders fetched successfully',
      data: {
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
 * @desc    Update order shipping and delivery status
 * @route   PUT /api/orders/:id/status
 * @access  Private/Admin
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderStatus, courierName, trackingNumber, note } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Do not mark unpaid orders as shipped or delivered
    if (['shipped', 'delivered'].includes(orderStatus) && order.paymentStatus !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Cannot mark an unpaid order as shipped or delivered.',
      });
    }

    order.orderStatus = orderStatus;

    if (courierName) order.courierName = courierName.trim();
    if (trackingNumber) order.trackingNumber = trackingNumber.trim();

    if (orderStatus === 'shipped' && !order.shippedAt) {
      order.shippedAt = new Date();
    }
    if (orderStatus === 'delivered' && !order.deliveredAt) {
      order.deliveredAt = new Date();
    }

    order.statusHistory.push({
      status: orderStatus,
      note: note || `Status changed to ${orderStatus}`,
      updatedAt: new Date(),
      updatedBy: req.user._id,
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: {
        order,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get order status and shipment tracking information
 * @route   GET /api/orders/:id/tracking
 * @access  Private/Owner or Admin
 */
const getOrderTracking = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const isOwner = order.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You cannot track another customer’s order.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order tracking fetched successfully',
      data: {
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        trackingNumber: order.trackingNumber,
        courierName: order.courierName,
        shippedAt: order.shippedAt,
        deliveredAt: order.deliveredAt,
        history: order.statusHistory,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get or generate invoice for a paid order
 * @route   GET /api/orders/:id/invoice
 * @access  Private/Owner or Admin
 */
const getInvoice = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const isOwner = order.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You cannot view another customer’s invoice.',
      });
    }

    if (order.paymentStatus !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Tax invoice is only available for successfully paid orders.',
      });
    }

    // Generate invoice if not already generated
    let invoiceKey = order.invoiceS3Key;
    let invoiceUrl = null;
    let invoiceNumber = order.invoiceNumber;

    if (!invoiceKey) {
      const genResult = await generateInvoice(order);
      invoiceKey = genResult.invoiceS3Key;
      invoiceUrl = genResult.invoiceUrl;
      invoiceNumber = genResult.invoiceNumber;

      order.invoiceNumber = invoiceNumber;
      order.invoiceS3Key = invoiceKey;
      order.invoiceGeneratedAt = new Date();
      await order.save();
    } else {
      const publicBaseUrl = process.env.S3_PUBLIC_BASE_URL
        ? process.env.S3_PUBLIC_BASE_URL.replace(/\/+$/, '')
        : `https://${process.env.AWS_S3_BUCKET || process.env.S3_BUCKET}.s3.${
            process.env.AWS_REGION || 'ap-south-1'
          }.amazonaws.com`;
      invoiceUrl = `${publicBaseUrl}/${invoiceKey}`;
    }

    res.status(200).json({
      success: true,
      message: 'Invoice retrieved successfully',
      data: {
        orderNumber: order.orderNumber,
        invoiceNumber,
        invoiceS3Key: invoiceKey,
        invoiceUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkout,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  getOrderTracking,
  getInvoice,
};
