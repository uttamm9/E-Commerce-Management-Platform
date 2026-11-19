const express = require('express');
const router = express.Router();

const {
  createPaymentOrder,
  verifyPayment,
  handleWebhook,
} = require('../controllers/paymentController');
const {
  createPaymentOrderValidator,
  verifyPaymentValidator,
} = require('../validators/orderValidator');
const validate = require('../middleware/validateMiddleware');
const protect = require('../middleware/authMiddleware');

// Razorpay webhook endpoint (strictly no JWT authentication)
router.post('/webhook', handleWebhook);

// Customer payment endpoints (JWT authentication required)
router.post(
  '/create-order',
  protect,
  createPaymentOrderValidator,
  validate,
  createPaymentOrder
);

router.post(
  '/verify',
  protect,
  verifyPaymentValidator,
  validate,
  verifyPayment
);

module.exports = router;
