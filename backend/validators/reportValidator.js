const { query } = require('express-validator');

const salesAnalyticsValidator = [
  query('period')
    .optional()
    .isIn(['daily', 'weekly', 'monthly', 'yearly'])
    .withMessage('Period must be daily, weekly, monthly, or yearly'),

  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('startDate must be a valid date in ISO 8601 or YYYY-MM-DD format'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('endDate must be a valid date in ISO 8601 or YYYY-MM-DD format'),
];

const topEntitiesValidator = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100'),

  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('startDate must be a valid date in ISO 8601 or YYYY-MM-DD format'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('endDate must be a valid date in ISO 8601 or YYYY-MM-DD format'),
];

const inventoryReportValidator = [
  query('status')
    .optional()
    .isIn(['all', 'in_stock', 'low_stock', 'out_of_stock'])
    .withMessage('Status must be all, in_stock, low_stock, or out_of_stock'),

  query('category')
    .optional()
    .isMongoId()
    .withMessage('Category must be a valid MongoDB ObjectId'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 200 })
    .withMessage('Limit must be an integer between 1 and 200'),
];

const orderReportValidator = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('startDate must be a valid date in ISO 8601 or YYYY-MM-DD format'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('endDate must be a valid date in ISO 8601 or YYYY-MM-DD format'),

  query('orderStatus')
    .optional()
    .isIn([
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'delivered',
      'on_hold',
      'cancelled',
    ])
    .withMessage('Invalid order status filter'),

  query('paymentStatus')
    .optional()
    .isIn(['pending', 'paid', 'failed'])
    .withMessage('Invalid payment status filter'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 200 })
    .withMessage('Limit must be an integer between 1 and 200'),
];

module.exports = {
  salesAnalyticsValidator,
  topEntitiesValidator,
  inventoryReportValidator,
  orderReportValidator,
};
