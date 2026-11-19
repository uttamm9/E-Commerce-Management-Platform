const { body, param } = require('express-validator');

const checkoutValidator = [
  body('shippingAddress')
    .isObject()
    .withMessage('Shipping address must be provided as an object'),

  body('shippingAddress.fullName')
    .trim()
    .notEmpty()
    .withMessage('Recipient full name is required'),

  body('shippingAddress.phone')
    .trim()
    .notEmpty()
    .withMessage('Contact phone number is required')
    .matches(/^[0-9+\s()-]{7,20}$/)
    .withMessage('Please provide a valid phone number'),

  body('shippingAddress.addressLine1')
    .trim()
    .notEmpty()
    .withMessage('Address line 1 is required'),

  body('shippingAddress.city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),

  body('shippingAddress.state')
    .trim()
    .notEmpty()
    .withMessage('State is required'),

  body('shippingAddress.postalCode')
    .trim()
    .notEmpty()
    .withMessage('Postal code is required'),

  body('shippingAddress.country')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Country cannot be empty'),
];

const createPaymentOrderValidator = [
  body('orderId')
    .trim()
    .notEmpty()
    .withMessage('Order ID is required')
    .isMongoId()
    .withMessage('Invalid order ID format'),
];

const verifyPaymentValidator = [
  body('orderId')
    .trim()
    .notEmpty()
    .withMessage('Order ID is required')
    .isMongoId()
    .withMessage('Invalid order ID format'),

  body('razorpay_order_id')
    .trim()
    .notEmpty()
    .withMessage('Razorpay Order ID is required'),

  body('razorpay_payment_id')
    .trim()
    .notEmpty()
    .withMessage('Razorpay Payment ID is required'),

  body('razorpay_signature')
    .trim()
    .notEmpty()
    .withMessage('Razorpay signature is required'),
];

const updateOrderStatusValidator = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Order ID is required')
    .isMongoId()
    .withMessage('Invalid order ID format'),

  body('orderStatus')
    .trim()
    .notEmpty()
    .withMessage('Order status is required')
    .isIn([
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'delivered',
      'on_hold',
      'cancelled',
    ])
    .withMessage('Invalid order status value'),

  body('courierName')
    .optional()
    .trim(),

  body('trackingNumber')
    .optional()
    .trim(),

  body('note')
    .optional()
    .trim(),
];

const orderIdParamValidator = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Order ID is required')
    .isMongoId()
    .withMessage('Invalid order ID format'),
];

module.exports = {
  checkoutValidator,
  createPaymentOrderValidator,
  verifyPaymentValidator,
  updateOrderStatusValidator,
  orderIdParamValidator,
};
