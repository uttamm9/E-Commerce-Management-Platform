const express = require('express');
const router = express.Router();

const {
  checkout,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  getOrderTracking,
  getInvoice,
} = require('../controllers/orderController');
const {
  checkoutValidator,
  updateOrderStatusValidator,
  orderIdParamValidator,
} = require('../validators/orderValidator');
const validate = require('../middleware/validateMiddleware');
const protect = require('../middleware/authMiddleware');
const isAdmin = require('../middleware/roleMiddleware');

// Customer checkout route
router.post('/checkout', protect, checkoutValidator, validate, checkout);

// Customer order history route (registered before /:id to prevent route clash)
router.get('/my-orders', protect, getMyOrders);

// Admin get all orders across system
router.get('/', protect, isAdmin, getAllOrders);

// Specific order details, tracking, and tax invoice (Owner or Admin)
router.get('/:id', protect, orderIdParamValidator, validate, getOrderById);
router.get('/:id/tracking', protect, orderIdParamValidator, validate, getOrderTracking);
router.get('/:id/invoice', protect, orderIdParamValidator, validate, getInvoice);

// Admin update order status and tracking
router.put(
  '/:id/status',
  protect,
  isAdmin,
  updateOrderStatusValidator,
  validate,
  updateOrderStatus
);

module.exports = router;
